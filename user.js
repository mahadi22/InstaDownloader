// ==UserScript==
// @name            InstaDownloader
// @namespace       mahadi22
// @version         0.0.5
// @description     View or download images, stories, albums, photos, videos and profile avatars.
// @author          mahadi22
// @namespace       mahadi22
// @homepage        https://github.com/mahadi22/InstaDownloader
// @license         https://www.apache.org/licenses/LICENSE-2.0
// @match           *://*.instagram.com/*
// @run-at          document-start
// @grant           none
// @downloadURL     https://github.com/mahadi22/InstaDownloader/raw/main/user.js
// ==/UserScript==

/*
 * # Instructions.
 *
 * Simply hold down a modifier key and click on any Instagram photo, video or profile avatar!
 *
 * - `Shift-click`: View in the same tab.
 * - `Alt-click`: View in a new tab/window.
 * - `Shift-Alt-click`: Direct download if supported by browser.
 *
 * Alternatively, you can use the keyboard controls, which are definitely a lot more convenient
 * if you're already using Instagram's own `left`/`right`-arrow navigation to switch between media!
 *
 * - `Shift-F`: View in the same tab.
 * - `Alt-F`: View in a new tab/window.
 * - `Shift-Alt-F`: Direct download if supported by browser.
 */
(function() {
    'use strict';

    var injectMediaMagnifier = function() {
        var handleMedia = function(e, url) {
            var i;

            if (typeof url !== 'string' || url.length < 1) {
                return true; 
            }

            var anchor = document.createElement('a');
            anchor.href = url;

            var isProtectedUrl = !!(anchor.pathname.match(/\/vp\//) || anchor.search.match(/[?&](?:oh|oe|efg)=/));

            var filename = null,
                filenameOffset = anchor.pathname.lastIndexOf('/');
            if (filenameOffset >= 0) {
                filename = anchor.pathname.substring(filenameOffset + 1);
                if (filename.length < 1) {
                    filename = null;
                }
            }

            if (!isProtectedUrl) {
                anchor.protocol = 'https:';
                if (typeof anchor.search === 'string' && anchor.search.length > 0) {
                    var queryParts = anchor.search.split('&');
                    for (i = queryParts.length - 1; i >= 0; --i) {
                        if (queryParts[i].match(/^\??(?:ig_cache_key|se)=/)) {
                            queryParts.splice(i, 1);
                        }
                    }
                    var newQuery = queryParts.join('&');
                    if (newQuery.length > 0 && newQuery.charAt(0) !== '?') {
                        newQuery = '?'+newQuery; 
                    }
                    anchor.search = newQuery;
                }

                
                
                
                
                
                
                
                
                
                
                
                var flags = anchor.pathname.split('/');
                //flags.splice(flags.length - 1, 1); 
                for (i = flags.length - 1; i >= 0; --i) {
                    if (flags[i].length > 0 && flags[i].match(/^(?:e\d+|c\d+\.\d+\.\d+\.\d+|[sp]\d+x\d+|sh\d+\.?\d*|fr)$/)) {
                        flags.splice(i, 1);
                    }
                }
                //anchor.pathname = flags.join('/')+'/'+filename; 
                anchor.pathname = flags.join('/');
            }

            

            
            if (e.shiftKey && e.altKey) { 
                
                
                anchor.target = '_self';
                anchor.download = filename; 
                anchor.click();
            } else if (e.altKey) { 
                var win = window.open(anchor.href, '_blank');
                win.focus(); 
            } else { 
                location.href = anchor.href;
            }

            e.stopPropagation(); 
            e.stopImmediatePropagation(); 
            e.preventDefault(); 
            return false;
        };

        var handleElement = function (e, elem) {
            switch (elem.tagName) {
                case 'IMG':
                case 'VIDEO':
                case 'DIV':
                case 'A':
                    
                    
                    
                    

                    
                    
                    
                    
                    
                    var elemIsMedia = (elem.tagName === 'IMG' || elem.tagName === 'VIDEO'),
                        mediaContainer = (elemIsMedia ? elem : (elem.parentNode || elem)),
                        photos = (mediaContainer.tagName === 'IMG' ? [mediaContainer] : (elemIsMedia ? [] : mediaContainer.getElementsByTagName('img'))),
                        videos = (mediaContainer.tagName === 'VIDEO' ? [mediaContainer] : (elemIsMedia ? [] : mediaContainer.getElementsByTagName('video')));

                    
                    if (videos.length === 1 && photos.length === 0) {
                        
                        var src = videos[0].hasAttribute('src') ? videos[0].src : null;
                        if (typeof src !== 'string' || src.length < 1) {
                            
                            
                            var subSources = videos[0].getElementsByTagName('source');
                            for (var i = 0; i < subSources.length; ++i) {
                                if (subSources[i].hasAttribute('src') && typeof subSources[i].src === 'string' && subSources[i].src.length >= 1) {
                                    src = subSources[i].src;
                                    break; 
                                }
                            }
                        }
                        return handleMedia(e, src);
                    } else if (photos.length === 1 && videos.length === 0) {
                        
                        return handleMedia(e, photos[0].src);
                    }
            }

            return true; 
        };

        
        document.addEventListener('click', function(e) {
            e = e || window.event;

            
            if (!e.shiftKey && !e.altKey) {
                return true; 
            }

            
            var target = e.target || e.srcElement;

            return handleElement(e, target);
        }, true); 

        
        document.addEventListener('keydown', function(e) {
            e = e || window.event;

            
            if (e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT')) {
                return true; 
            }

            
            if ((e.shiftKey || e.altKey) && e.keyCode === 70) {
                
                
                
                
                
                
                
                
                
                var mediaPanel = document.querySelector(
                    'div[role="dialog"] article > div:nth-of-type(1), main[role="main"] > * article > div:nth-of-type(1), #react-root > section > div > div > section > div:nth-of-type(2)'
                );
                if (mediaPanel) {
                    var video = mediaPanel.querySelector('video'),
                        photo = mediaPanel.querySelector('img'),
                        target = (video ? video : (photo ? photo : null));
                    if (target) {
                        return handleElement(e, target);
                    }
                }
            }

            return true; 
        }, true); 
    };

    var injectMediaCounter = function() {
        
        var SectionState = function(section) {
            this.section = section;
            this.loadedMediaIds = new Set();
            this.loadedCount = -1;
            this.totalCount = -1;
            
            
            this.mediaBoxElem = section ? section.querySelector('main > article > div > div:nth-of-type(1)') : null;
        };

        
        SectionState.prototype.updateTotalMediaCount = function() {
            
            
            
            
            
            var mediaCountSpans = this.section.querySelectorAll('header ul > li:nth-of-type(1) span');
            for (var i = mediaCountSpans.length - 1; i >= 0; --i) { 
                
                var count = mediaCountSpans[i].textContent.replace(/[^0-9]+/g, '');
                if (count.length > 0) {
                    try {
                        count = parseInt(count, 10);
                        if (Number.isInteger(count)) { 
                            this.totalCount = count;
                            return;
                        }
                    } catch (e) {}
                }
            }

            this.totalCount = 0; 
        };

        
        SectionState.prototype.updateLoadedMediaCount = function() {
            
            
            var count = 0;
            if (this.mediaBoxElem) {
                var mediaLinks = this.mediaBoxElem.querySelectorAll('a[href^="/p/"]');
                for (var i = 0, len = mediaLinks.length; i < len; ++i) {
                    this.loadedMediaIds.add(mediaLinks[i].pathname); 
                }

                count = this.loadedMediaIds.size;
                if (count > this.totalCount) {
                    count = this.totalCount; 
                }
            }

            this.loadedCount = count;
        };

        
        var MediaCounter = function() {
            
            this.currentProfile = this.extractProfileName(location.pathname);
            this.activeState = null;
            this.counterElem = null;
            this.isCounterVisible = false;
            this.updateCooldownTimer = undefined;

            
            this.createCounterElem();
            this.attachReactRootObserver();
            this.startWatchingPathname();
        };

        
        MediaCounter.prototype.createCounterElem = function() {
            
            var floatContainer = document.createElement('div');
            floatContainer.style.position = 'fixed';
            floatContainer.style.bottom = 0;
            floatContainer.style.right = 0;
            floatContainer.style.zIndex = '99999';

            
            var counterElem = document.createElement('div');
            counterElem.style.margin = '14px'; 
            counterElem.style.padding = '5px 10px'; 
            counterElem.style.backgroundColor = 'rgba(60,60,60,0.5)';
            counterElem.style.borderRadius = '15px';
            counterElem.style.font = 'bold 13px sans-serif';
            counterElem.style.color = '#fff';
            counterElem.style.textAlign = 'center';
            counterElem.style.textShadow = '1px 1px 2px rgba(0,0,0,0.3)';
            counterElem.style.display = 'none'; 
            counterElem.title = 'Shift-[click/F]: View in the same tab.\nAlt-[click/F]: View in a new tab/window.\nShift-Alt-[click/F]: Direct download.';
            floatContainer.appendChild(counterElem);

            
            
            document.body.appendChild(floatContainer);

            this.counterElem = counterElem;
        };

        
        MediaCounter.prototype.extractProfileName = function(pathname) {
            if (typeof pathname === 'string') {
                
                
                
                var match = pathname.match(/^\/([^\/]+)\/?$/); 
                if (match) {
                    var profile = match[1];
                    if (profile !== 'developer') {
                        return profile;
                    }
                }
            }

            return null;
        };

        
        
        MediaCounter.prototype.startWatchingPathname = function() {
            var self = this,
                currentPathname = null;
            setInterval(function() {
                
                if (location.pathname !== currentPathname) {
                    currentPathname = location.pathname;

                    
                    
                    var profile = self.extractProfileName(currentPathname);
                    if (profile !== null) { 
                        if (profile === self.currentProfile && self.counterElem.textContent !== '') { 
                            self.toggleMediaCounterVisibility(true);
                        } else { 
                            
                            self.currentProfile = profile; 
                        }
                    } else { 
                        self.toggleMediaCounterVisibility(false);
                    }
                }
            }, 250);
        };

        
        MediaCounter.prototype.toggleMediaCounterVisibility = function(showCounter) {
            if (showCounter !== this.isCounterVisible) {
                this.counterElem.style.display = showCounter ? 'block' : 'none';
                this.isCounterVisible = !!showCounter;
            }
        };

        
        MediaCounter.prototype.updateMediaCounter = function(forceUpdateTotal) {
            if (!this.activeState) {
                return;
            }

            
            if (forceUpdateTotal || this.activeState.totalCount < 0) {
                this.activeState.updateTotalMediaCount(); 
            }
            this.activeState.updateLoadedMediaCount();

            
            var percentLoaded = this.activeState.totalCount > 0 ? ((this.activeState.loadedCount / this.activeState.totalCount) * 100) : 0; 
            percentLoaded = percentLoaded.toFixed(1); 
            this.counterElem.textContent = this.activeState.loadedCount+' / '+this.activeState.totalCount+' ('+percentLoaded+'%)';

            
            this.toggleMediaCounterVisibility(this.extractProfileName(location.pathname) !== null);
        };

        
        
        
        MediaCounter.prototype.observeSection = function(section) {
            
            
            
            var state = new SectionState(section);

            
            
            
            if (!state.mediaBoxElem) {
                
                this.activeState = null;
                this.toggleMediaCounterVisibility(false);
                return; 
            }

            
            this.activeState = state;

            
            this.updateMediaCounter(true);

            
            this.unobserveSection(section);

            
            var self = this,
                config = { attributes: false, childList: true, characterData: false },
                observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'childList') {
                            clearTimeout(self.updateCooldownTimer);
                            self.updateCooldownTimer = setTimeout(function() {
                                
                                if (state === self.activeState) {
                                    self.updateMediaCounter();
                                }
                            }, 150); 
                        }
                    });
                });
            observer.observe(state.mediaBoxElem, config);

            
            section.instaMagnifyObserver = observer;
        };

        
        MediaCounter.prototype.unobserveSection = function(section) {
            if (section.instaMagnifyObserver) {
                section.instaMagnifyObserver.disconnect();
                delete section.instaMagnifyObserver;
            }
        };

        
        MediaCounter.prototype.attachReactRootObserver = function() {
            var self = this,
                interestingChanges = ['addedNodes', 'removedNodes'],
                config = { attributes: false, childList: true, characterData: false },
                observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        
                        
                        if (mutation.type === 'childList') {
                            for (var i = 0; i < interestingChanges.length; ++i) {
                                var field = interestingChanges[i];
                                for (var x = 0, len = mutation[field].length; x < len; ++x) {
                                    var node = mutation[field][x];
                                    if (node.tagName === 'SECTION') {
                                        if (field === 'addedNodes') {
                                            self.observeSection(node);
                                        } else {
                                            self.unobserveSection(node);
                                        }
                                    }
                                }
                            }
                        }
                    });
                });

            
            var reactRootElem = document.querySelector('span#react-root');
            if (reactRootElem) {
                observer.observe(reactRootElem, config);

                
                var children = reactRootElem.childNodes;
                for (var i = 0; i < children.length; ++i) {
                    var node = children[i];
                    if (node.tagName === 'SECTION') {
                        self.observeSection(node);
                    }
                }
            }
        };

        
        var mediaCounter = new MediaCounter();
    };

    var injectAutoActions = function() {
        var autoLoadMore = function() {
            
            
            
            
            if (window.pageYOffset <= 500) {
                return;
            }

            
            
            
            
            var loadMore = document.querySelectorAll('article > div > a[href*="max_id="]');
            for (var i = 0; i < loadMore.length; ++i) {
                
                
                if (loadMore[i].pathname.match(/^\/(?:[^\/]+\/$|explore\/)/) && loadMore[i].search.match(/[?&]max_id=/)) {
                    loadMore[i].click();
                    break;
                }
            }
        };

        var autoCloseMobileAppDialog = function() {
            
            
            
            
            
            
            if (location.hash.length < 11) {
                return;
            }

            
            if (location.hash.indexOf('reactivated') >= 0) {
                
                
                
                location.hash = '';

                
                var isClosed = false,
                    closeMobileAppDialog = function() {
                        if (isClosed) {
                            return;
                        }
                        var dialogs = document.querySelectorAll('div[role="dialog"]');
                        for (var i = 0; i < dialogs.length; ++i) {
                            var appStoreLink = dialogs[i].querySelector('a[href*="itunes.apple.com"]');
                            if (appStoreLink) {
                                
                                var closeButton = dialogs[i].querySelector('button');
                                if (closeButton) {
                                    closeButton.click();
                                    isClosed = true;
                                }
                            }
                        }
                    };
                closeMobileAppDialog();
                if (!isClosed) {
                    var attempt = 0,
                        closeDialogInterval = setInterval(function() {
                            
                            if (isClosed || ++attempt > 30) {
                                clearInterval(closeDialogInterval);
                                return;
                            }
                            closeMobileAppDialog();
                        }, 250);
                }
            }
        };

        
        
        setInterval(function() {
            autoLoadMore();
            autoCloseMobileAppDialog();
        }, 400);
    };

    
    var injectHandlers = function() {
        injectMediaMagnifier();
        injectMediaCounter();
        injectAutoActions();
    };
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        injectHandlers();
    } else {
        var hasInjected = false;
        document.addEventListener('readystatechange', function(evt) {
            if (document.readyState === 'interactive' || document.readyState === 'complete') {
                if (!hasInjected) {
                    injectHandlers();
                    hasInjected = true;
                }
            }
        } );
    }
})();
