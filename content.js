
/**
 * Content Script to extract X usernames and avatars from the DOM
 */
(function() {
  const links = Array.from(document.querySelectorAll('a[href]'));
  const xUsernameRegex = /^(?:https?:\/\/(?:www\.)?(?:x|twitter)\.com\/)?([a-zA-Z0-9_]{1,15})(?:\/.*)?$/i;
  
  // System/ignored paths on X
  const excludedPaths = [
    'home', 'explore', 'notifications', 'messages', 'i', 'search', 
    'settings', 'compose', 'tos', 'privacy', 'about', 'help', 
    'business', 'status', 'intent', 'share', 'hashtag', 'search-advanced',
    'search-live', 'login', 'signup', 'account'
  ];

  const results = [];
  const seenUsernames = new Set();

  links.forEach(link => {
    const href = link.href;
    const match = href.match(xUsernameRegex);
    
    if (match && match[1]) {
      const username = match[1];
      const lowerUsername = username.toLowerCase();
      
      if (!excludedPaths.includes(lowerUsername) && isNaN(lowerUsername) && !seenUsernames.has(lowerUsername)) {
        seenUsernames.add(lowerUsername);
        
        // Try to find an avatar image
        // 1. Look inside the link
        let avatar = null;
        const innerImg = link.querySelector('img');
        if (innerImg && innerImg.src && !innerImg.src.includes('data:image/svg')) {
          avatar = innerImg.src;
        }
        
        // 2. Look in immediate sibling or parent's first img (common in profile lists)
        if (!avatar) {
          const parent = link.closest('div, span, li');
          if (parent) {
            const parentImg = parent.querySelector('img');
            if (parentImg && parentImg.src && !parentImg.src.includes('data:image/svg')) {
              avatar = parentImg.src;
            }
          }
        }

        results.push({
          username: username,
          avatar: avatar
        });
      }
    }
  });

  return results;
})();
