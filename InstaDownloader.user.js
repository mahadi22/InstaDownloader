// ==UserScript==
// @name            InstaDownloader
// @namespace       mahadi22
// @author          mahadi22
// @version         1.9.0
// @description     View or download images, stories, albums, photos, videos and profile avatars.
// @homepage        https://github.com/mahadi22/InstaDownloader
// @downloadURL     https://github.com/mahadi22/InstaDownloader/raw/main/InstaDownloader.user.js
// @icon            https://raw.githubusercontent.com/mahadi22/InstaDownloader/main/favicon.ico
// @license         https://www.apache.org/licenses/LICENSE-2.0
// @match           *://*.instagram.com/*
// @run-at          document-start
// @grant           none
// ==/UserScript==

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
            anchor.protocol = 'https:';
            
            if (typeof anchor.search === 'string' && anchor.search.length > 0) {
                var queryParts = anchor.search.split('&');
                for (i = queryParts.length - 1; i >= 0; --i) {
                    if (queryParts[i].match(/^\??(?:ig_cache_key|se|ig_tt)=/)) {
                        queryParts.splice(i, 1);
                    }
                }
                var newQuery = queryParts.join('&');
                if (newQuery.length > 0 && newQuery.charAt(0) !== '?') {
                    newQuery = '?'+newQuery; 
                }
                anchor.search = newQuery;
            }
            
            if (!isProtectedUrl) {
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
                if (!window.fetch) {
                    anchor.target = '_self';
                    anchor.download = filename; 
                    anchor.click();
                } else {
                    window.fetch(anchor.href, {
                        headers: new Headers({
                            'Origin': location.origin
                        }),
                        mode: 'cors',
                        redirect: 'follow',
                        referrerPolicy: 'no-referrer',
                        cache: 'force-cache' 
                    }).then(function(response) {
                        if (!response.ok || response.status !== 200) {
                            throw new Error('Network response was not ok.');
                        }
                        return response.blob();
                    }).then(function(blob) {
                        
                        var blobUrl = URL.createObjectURL(blob),
                            a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = filename;
                        a.click();
                    }).catch(function(e) {
                        var errMsg = '"'+e+'" when downloading "'+filename+'".';
                        console.error(errMsg);
                        alert(errMsg);
                    });
                }
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
        var handleElement = function (e, elem, isLastAttempt) {
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
                    } else if (!isLastAttempt) {
                        
                        
                        return handleElement(e, mediaContainer, true);
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

        var autoCloseAnnoyingBars = function() {
            var i, elem, elems;
            var signupBar = document.querySelector('div.coreSpriteLoggedOutGenericUpsell');
            if (signupBar) {
                var closeButton = signupBar.parentNode.parentNode.querySelector('.coreSpriteDismissLarge[role="button"]');
                if (closeButton)
                    closeButton.click();
            }
            var whiteBar = document.querySelector('.coreSpriteGlyphGradient');
            if (whiteBar) {
                var signupLink = whiteBar.parentNode.parentNode.parentNode.parentNode.querySelector('a[href*="signup"]');
                if (signupLink) {
                    elems = signupLink.parentNode.parentNode.childNodes;
                    for (i = elems.length - 1; i >= 0; --i) {
                        elem = elems[i];
                        if (elem.tagName === 'SPAN' && elem.textContent === '✕') { 
                            elem.click();
                            break;
                        }
                    }
                }
            }
            
            var getAppBar = document.querySelector('.coreSpriteAppIcon');
            if (getAppBar) {
                var appStoreLink = getAppBar.parentNode.parentNode.querySelector('a[href*="itunes.apple.com"]');
                if (appStoreLink) {
                    elems = appStoreLink.parentNode.parentNode.parentNode.parentNode.parentNode.childNodes;
                    for (i = elems.length - 1; i >= 0; --i) {
                        elem = elems[i];
                        if (elem.tagName === 'SPAN' && elem.textContent === '✕') { 
                            elem.click();
                            break;
                        }
                    }
                }
            }
        };
        
        setInterval(function() {
            autoLoadMore();
            autoCloseMobileAppDialog();
            autoCloseAnnoyingBars();
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

;(function () {
  'use strict'

  const $ = (selector) => document.querySelector(selector)
  const $$ = (selector) => document.querySelectorAll(selector)

  const map = new WeakMap()
  const internal = key => {
    if (!map.has(key)) map.set(key, {})
    return map.get(key)
  }

  let _this

  function throttle(fn, interval) {
    let timeBefore = null
    return () => {
      const timeNow = Date.now()
      if (timeBefore === null) timeBefore = timeNow
      if (timeNow - timeBefore > interval) {
        timeBefore = timeNow
        fn.apply(this, arguments)
      }
    }
  }

  class Instagram {
    constructor(options) {
      const defaults = {
        delay: 200
      }
      this.setting = Object.assign({}, defaults, options)
      this.delay = this.setting.delay
      this.body = $('body')
      this.init()
      _this = internal(this)
      _this.render = throttle.call(this, this.animate, this.delay)
    }

    init() {
      this.observer(this.body)
      this.addStyles()
    }

    addStyles() {
      const headEle = $('head'),
        style = document.createElement('style'),
        styleText = `
          .hover-img:hover .download-btn {
          opacity: 1;
          }
          .download-btn {
          position: absolute;
          top: 50px;
          right: 50px;
          width: 40px;
          height: 40px;
          background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAoCAYAAACM/rhtAAAACXBIWXMAAAsTAAALEwEAmpwYAAAF4mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAxOC0wMS0yMlQwMDoyNDoyOCswODowMCIgeG1wOk1vZGlmeURhdGU9IjIwMTgtMDEtMjJUMDA6MzIrMDg6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMTgtMDEtMjJUMDA6MzIrMDg6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6ZjRmMjA5YjAtZDcwNC01MzRiLWEzZmYtMzExZDVkMzIyMTJkIiB4bXBNTTpEb2N1bWVudElEPSJhZG9iZTpkb2NpZDpwaG90b3Nob3A6MjFmM2E2NzctOGQyYy1jZTQxLTg4MTMtMDlhY2I4NDMyZTc3IiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6MGMzMmZjMDItZTBhZS01MjQ1LTk4YjktMzhiYTAwZTEyMWI1Ij4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowYzMyZmMwMi1lMGFlLTUyNDUtOThiOS0zOGJhMDBlMTIxYjUiIHN0RXZ0OndoZW49IjIwMTgtMDEtMjJUMDA6MjQ6MjgrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCBDQyAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmY0ZjIwOWIwLWQ3MDQtNTM0Yi1hM2ZmLTMxMWQ1ZDMyMjEyZCIgc3RFdnQ6d2hlbj0iMjAxOC0wMS0yMlQwMDozMiswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIChXaW5kb3dzKSIgc3RFdnQ6Y2hhbmdlZD0iLyIvPiA8L3JkZjpTZXE+IDwveG1wTU06SGlzdG9yeT4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6RBZmNAAANpklEQVRYhaWYe7BdVX3HP+uxX+ece29ubm4eN7mJgdyGQIQIxJLY8BQowkhbEJuMdhTaDiCjFeurSu1YpqNFpaOj2FJHp4i2TuOjQlAg1RBFEyKCEI088uAmCEnOzX2dc/ZrrV//2DfnQhGr9DezZ+1Zs3/r91nftdZvr7XU+zbu4oWmgAxDx1icUhRonFI4pbvfeEChEiWy1iBrNLIhwC+zXupGPNZLy3g5YMVtD8U/Ejj3UOzLTuQdUemIXUnicmJXEjlH4DyhcwSu5H+bfUnNy5gAgkIhF2jYZMVdaPHD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');
          transition: opacity .3s;
          opacity: 0;
          }`
      style.innerHTML = styleText
      headEle.append(style)
    }

    observer(ele) {
      const config = {
        attributes: true,
        childList: true,
        subtree: true
      }
      const observer = new MutationObserver(mutations => {
        _this.render()
      })
      observer.observe(ele, config)
    }

    animate() {
      const wraps = Array.from($$(this.setting.wrap))
      if (!wraps) return
      wraps.forEach(wrap => {
        if (wrap.querySelector(`.${this.setting.btnClass}`)) return
        wrap.classList.add('hover-img')
        const video = wrap.querySelector('video')
        const img = wrap.querySelector('img')
        if (video) {
          this.downloadVideo(wrap, video)
        } else if (img) {
          this.downloadImage(wrap, img)
        }
      })
    }

    downloadImage(wrap, img) {
      const srcset = img.getAttribute('srcset')
      if (srcset) {
        let href = srcset.split(',').pop()
        href = href.slice(0, href.indexOf(' '))
        this.addBtn(wrap, href)
      }
    }

    downloadVideo(wrap, video) {
      const src = video.getAttribute('src')
      if (src) {
        this.addBtn(wrap, src)
      }
    }

    addBtn(wrap, href) {
      const btn = wrap.querySelector(`.${this.setting.btnClass}`)
      if (btn) {
        wrap.removeChild(btn)
      }
      const ele = document.createElement('a')
      ele.classList.add(this.setting.btnClass)
      ele.setAttribute('href', href)
      ele.setAttribute('target', '_blank')
      ele.setAttribute('download', '')
      wrap.append(ele)
    }
  }

  window.insIntance = new Instagram({
    delay: 100,
    btnClass: 'download-btn',
    wrap: '._gxii9'
  })
})()
