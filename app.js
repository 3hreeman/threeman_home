// Current state
let currentTab = 'home';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check hash for initial routing
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
});

function handleHashChange() {
    const hash = window.location.hash.slice(1); // remove '#'
    
    if (!hash) {
        loadTab('home');
        return;
    }

    // Handle post view (e.g., #book/post-id)
    if (hash.includes('/')) {
        const [tab, postId] = hash.split('/');
        loadPost(tab, postId);
    } else {
        // Handle tab view (e.g., #book)
        loadTab(hash, false);
    }
}

function updateActiveButton(tabName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.toLowerCase() === tabName) {
            btn.classList.add('active');
        }
    });
}

function loadTab(tabName, updateHistory = true) {
    currentTab = tabName;
    updateActiveButton(tabName);
    
    if (updateHistory) {
        // Only push state if called from button click, not hash change
        history.pushState(null, null, `#${tabName}`);
    }

    // Load content based on tab name
    const contentDiv = document.getElementById('main-content');
    
    if (tabName === 'home') {
        renderMarkdownFile('content/home.md', contentDiv);
    } else if(tabName === 'about') {
		renderMarkdownFile('content/about.md', contentDiv);
	}
	else if (tabName === 'book' || tabName === 'archive') {
        renderPostList(tabName, contentDiv);
    } else {
        contentDiv.innerHTML = '<p>Page not found.</p>';
    }
}

function renderPostList(category, container) {
    const categoryPosts = posts[category];
    
    if (!categoryPosts || categoryPosts.length === 0) {
        container.innerHTML = '<p>No posts found.</p>';
        return;
    }

    let html = '<ul class="post-list">';
    categoryPosts.forEach(post => {
        html += `
            <li class="post-item">
                <a href="#${category}/${post.id}">${post.title}</a>
                <span class="post-date">${post.date}</span>
            </li>
        `;
    });
    html += '</ul>';
    
    container.innerHTML = html;
}

function loadPost(category, postId) {
    updateActiveButton(category);
    const categoryPosts = posts[category];
    const post = categoryPosts.find(p => p.id === postId);
    
    const contentDiv = document.getElementById('main-content');
    
    if (!post) {
        contentDiv.innerHTML = '<p>Post not found.</p>';
        return;
    }

    // Add back button, markdown container, and Giscus container
    let html = `<a onclick="history.back()" class="back-btn">← Back to ${category}</a>`;
    html += `<div id="markdown-content">Loading content...</div>`;
    html += `<section class="giscus-container"></section>`;
    contentDiv.innerHTML = html;

    // Load actual markdown content, then load Giscus
    renderMarkdownFile(post.file, document.getElementById('markdown-content'))
        .then(loadGiscus)
        .catch(error => console.error("Couldn't load post or Giscus", error));
}

function loadGiscus() {
    const giscusContainer = document.querySelector('.giscus-container');
    if (!giscusContainer) return;

    // Clear previous instance to prevent duplicates when navigating
    while (giscusContainer.firstChild) {
        giscusContainer.removeChild(giscusContainer.firstChild);
    }

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', '3hreeman/threeman_home');
    script.setAttribute('data-repo-id', 'R_kgDORA777Q');
    script.setAttribute('data-category', 'Ideas');
    script.setAttribute('data-category-id', 'DIC_kwDORA777c4C1pro');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'ko');
    script.crossOrigin = 'anonymous';
    script.async = true;

    giscusContainer.appendChild(script);
}

function renderMarkdownFile(filePath, container) {
    return fetch(filePath)
        .then(response => {
            if (!response.ok) throw new Error(`Network response was not ok for ${filePath}`);
            return response.text();
        })
        .then(text => {
            container.innerHTML = marked.parse(text);
        })
        .catch(error => {
            console.error('Error loading markdown:', error);
            container.innerHTML = `<p>Error loading content. Please try again later. (Path: ${filePath})</p>`;
            throw error; // Re-throw to allow .catch in the caller to handle it
        });
}