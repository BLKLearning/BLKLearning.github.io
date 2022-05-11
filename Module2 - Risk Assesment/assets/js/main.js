/*
 * classList.js: Cross-browser full element.classList implementation.
 * 1.1.20170427
 *
 * By Eli Grey, http://eligrey.com
 * License: Dedicated to the public domain.
 *   See https://github.com/eligrey/classList.js/blob/master/LICENSE.md
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */


if ("document" in window.self) {
  

    // Full polyfill for browsers with no classList support
    // Including IE < Edge missing SVGElement.classList
    if (!("classList" in document.createElement("_")) 
        || document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg","g"))) {
    
    (function (view) {
    
    "use strict";
    
    if (!('Element' in view)) return;
    
    var
          classListProp = "classList"
        , protoProp = "prototype"
        , elemCtrProto = view.Element[protoProp]
        , objCtr = Object
        , strTrim = String[protoProp].trim || function () {
            return this.replace(/^\s+|\s+$/g, "");
        }
        , arrIndexOf = Array[protoProp].indexOf || function (item) {
            var
                  i = 0
                , len = this.length
            ;
            for (; i < len; i++) {
                if (i in this && this[i] === item) {
                    return i;
                }
            }
            return -1;
        }
        // Vendors: please allow content code to instantiate DOMExceptions
        , DOMEx = function (type, message) {
            this.name = type;
            this.code = DOMException[type];
            this.message = message;
        }
        , checkTokenAndGetIndex = function (classList, token) {
            if (token === "") {
                throw new DOMEx(
                      "SYNTAX_ERR"
                    , "An invalid or illegal string was specified"
                );
            }
            if (/\s/.test(token)) {
                throw new DOMEx(
                      "INVALID_CHARACTER_ERR"
                    , "String contains an invalid character"
                );
            }
            return arrIndexOf.call(classList, token);
        }
        , ClassList = function (elem) {
            var
                  trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
                , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
                , i = 0
                , len = classes.length
            ;
            for (; i < len; i++) {
                this.push(classes[i]);
            }
            this._updateClassName = function () {
                elem.setAttribute("class", this.toString());
            };
        }
        , classListProto = ClassList[protoProp] = []
        , classListGetter = function () {
            return new ClassList(this);
        }
    ;
    // Most DOMException implementations don't allow calling DOMException's toString()
    // on non-DOMExceptions. Error's toString() is sufficient here.
    DOMEx[protoProp] = Error[protoProp];
    classListProto.item = function (i) {
        return this[i] || null;
    };
    classListProto.contains = function (token) {
        token += "";
        return checkTokenAndGetIndex(this, token) !== -1;
      
    };
    classListProto.add = function () {
        var
              tokens = arguments
            , i = 0
            , l = tokens.length
            , token
            , updated = false
        ;
        do {
            token = tokens[i] + "";
            if (checkTokenAndGetIndex(this, token) === -1) {
                this.push(token);
                updated = true;
            }
        }
        while (++i < l);
    
        if (updated) {
            this._updateClassName();
        }
    };
    classListProto.remove = function () {
        var
              tokens = arguments
            , i = 0
            , l = tokens.length
            , token
            , updated = false
            , index
        ;
        do {
            token = tokens[i] + "";
            index = checkTokenAndGetIndex(this, token);
            while (index !== -1) {
                this.splice(index, 1);
                updated = true;
                index = checkTokenAndGetIndex(this, token);
            }
        }
        while (++i < l);
    
        if (updated) {
            this._updateClassName();
        }
    };
    classListProto.toggle = function (token, force) {
        token += "";
    
        var
              result = this.contains(token)
            , method = result ?
                force !== true && "remove"
            :
                force !== false && "add"
        ;
    
        if (method) {
            this[method](token);
        }
    
        if (force === true || force === false) {
            return force;
        } else {
            return !result;
        }
    };
    classListProto.toString = function () {
        return this.join(" ");
    };
    
    if (objCtr.defineProperty) {
        var classListPropDesc = {
              get: classListGetter
            , enumerable: true
            , configurable: true
        };
        try {
            objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
        } catch (ex) { // IE 8 doesn't support enumerable:true
            // adding undefined to fight this issue https://github.com/eligrey/classList.js/issues/36
            // modernie IE8-MSW7 machine has IE8 8.0.6001.18702 and is affected
            if (ex.number === undefined || ex.number === -0x7FF5EC54) {
                classListPropDesc.enumerable = false;
                objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
            }
        }
    } else if (objCtr[protoProp].__defineGetter__) {
        elemCtrProto.__defineGetter__(classListProp, classListGetter);
    }
    
    }(window.self));
    
    }
    
    // There is full or partial native classList support, so just check if we need
    // to normalize the add/remove and toggle APIs.
    
    (function () {
        "use strict";
    
        var testElement = document.createElement("_");
    
        testElement.classList.add("c1", "c2");
    
        // Polyfill for IE 10/11 and Firefox <26, where classList.add and
        // classList.remove exist but support only one argument at a time.
        if (!testElement.classList.contains("c2")) {
            var createMethod = function(method) {
                var original = DOMTokenList.prototype[method];
    
                DOMTokenList.prototype[method] = function(token) {
                    var i, len = arguments.length;
    
                    for (i = 0; i < len; i++) {
                        token = arguments[i];
                        original.call(this, token);
                    }
                };
            };
            createMethod('add');
            createMethod('remove');
        }
    
        testElement.classList.toggle("c3", false);
    
        // Polyfill for IE 10 and Firefox <24, where classList.toggle does not
        // support the second argument.
        if (testElement.classList.contains("c3")) {
            var _toggle = DOMTokenList.prototype.toggle;
    
            DOMTokenList.prototype.toggle = function(token, force) {
                if (1 in arguments && !this.contains(token) === !force) {
                    return force;
                } else {
                    return _toggle.call(this, token);
                }
            };
    
        }
    
        testElement = null;
    }());
    
    }
    
    
    // Polyfill for creating CustomEvents on IE9/10/11
    
    // code pulled from:
    // https://github.com/d4tocchini/customevent-polyfill
    // https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent#Polyfill
    
    (function() {
      if (typeof window === 'undefined') {
        return;
      }
    
      try {
        var ce = new window.CustomEvent('test', { cancelable: true });
        ce.preventDefault();
        if (ce.defaultPrevented !== true) {
          // IE has problems with .preventDefault() on custom events
          // http://stackoverflow.com/questions/23349191
          throw new Error('Could not prevent default');
        }
      } catch (e) {
        var CustomEvent = function(event, params) {
          var evt, origPrevent;
          params = params || {};
          params.bubbles = !!params.bubbles;
          params.cancelable = !!params.cancelable;
    
          evt = document.createEvent('CustomEvent');
          evt.initCustomEvent(
            event,
            params.bubbles,
            params.cancelable,
            params.detail
          );
          origPrevent = evt.preventDefault;
          evt.preventDefault = function() {
            origPrevent.call(this);
            try {
              Object.defineProperty(this, 'defaultPrevented', {
                get: function() {
                  return true;
                }
              });
            } catch (e) {
              this.defaultPrevented = true;
            }
          };
          return evt;
        };
    
        CustomEvent.prototype = window.Event.prototype;
        window.CustomEvent = CustomEvent; // expose definition to window
      }
    })();
    
    /* global */
    

    
    /* ========================================================================
     * LMApp - Learning Module Application
     * ======================================================================== */
    
    var LMApp = ( function () {
      'use strict';
    
      // event alias
      var events = {
        PAGE_CHANGE: 'pagechange',
        UI_UPDATE: 'uiupdate'
      };
    
      var _routes = [];
      var _pages = [];
      var _data = { index: 0, currentId: null, lastId: null, total: 0 };
      var _uiRoot = document;
      var _componentInstances = {};
      var _registeredComponents = [];
    
      // Helper Functions
      function _$$( selectors, context ) {
        return Array.prototype.slice.call( ( context || document ).querySelectorAll( selectors ) );
      }
    
      function _elem( id, context ) {
        return ( context || document ).getElementById( id );
      }
    
      function _hashToId() {
        var hash = location.hash.slice( 1 );
    
        return ( hash !== '' ) ? hash : null;
      }
    
      function _getRouteIndex( id ) {
        var i = 0, len = _routes.length;
    
        for ( i = 0; i < len; i++ ) {
          if ( _routes[i].id === id ) {
            return i;
          }
        }
    
        return -1;
      }
    
      function _routeById( id ) {
        var i = 0, len = _routes.length;
    
        for ( i = 0; i < len; i++ ) {
    
          if ( _routes[i].id === id || _elem( _routes[i].id ).contains( _elem( id ) ) ) {
            return _routes[i].id;
          }
    
        }
    
        return null;
      }
    
    
      function _renderPage( newId, focusId ) {
    
        if ( _data.currentId ) {
          _elem( _data.currentId ).hidden = true;
        }
    
        _data.index = _getRouteIndex( newId );
        _data.lastId = _data.currentId;
        _data.currentId = newId;
    
        _elem( _data.currentId ).hidden = false;
        _elem( _data.currentId ).focus();
    
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    
        _uiRoot.dispatchEvent( new CustomEvent( events.UI_UPDATE, { detail: _data } ) );
    
    
        if ( newId !== focusId ) {
          _elem( focusId ).focus();
          _elem( focusId ).scrollIntoView();
        }
    
      }
    
    
      function _getComponentInstance( id ) {
        if ( !id ) {
          return null;
        }
    
        return _componentInstances[ id ];
      }
    
      function _register( obj ) {
        _registeredComponents.push( obj );
      }
    
    
      function _upgradeDom( obj ) {
        var elements = _$$( obj.selector );
    
        elements.forEach( function ( element ) {
          var instance = {};
    
          if ( obj.context === 'ui' ) {
            instance = new obj.constructor( element, _routes );
          } else {
            instance = new obj.constructor( element );
          }
    
          _componentInstances[element.id] = instance;
        } );
      }
    
    
      function _upgradeRegistered( ) {
        var len = _registeredComponents.length;
    
        for ( var i = 0; i < len; i++ ) {
          _upgradeDom( _registeredComponents[i] );
        }
    
      }
    
    
      function _updateOffset( ) {
        var offset = window.pageYOffset;
    
        document.documentElement.setAttribute( 'data-offset', offset );
    
        if ( offset > 200 ) {
          document.documentElement.classList.add( 'scroll-offset' );
        } else {
          document.documentElement.classList.remove( 'scroll-offset' );
        }
    
      }
    
      // init
      function _initialize() {
    
        _pages = _$$( '[data-page]' );
    
        _pages.forEach( function ( page ) {
    
          page.setAttribute( 'hidden', 'true' );
          page.setAttribute( 'tabindex', '-1' );
    
          if ( page.tagName.toLowerCase() === 'div' ) {
            page.setAttribute( 'role', 'region' );
          }
    
          var h = page.querySelector( 'h1, h2' );
    
          if ( h ) {
            page.setAttribute( 'aria-labelledby', page.id + '-label' );
            h.setAttribute( 'id', page.id + '-label' );
          }
        
          var obj = {};
    
          obj.id = page.id;
          obj.title = h ? h.innerHTML : 'No title set';
          obj.dataLocalize = h ? h.getAttribute('data-localize') : 'No title set';
          obj.viewed = 0;
          _routes.push( obj );
    
        } );
    
        _data.total = _routes.length;
    
        var _scrollWatch = new LMApp.Debounce( _updateOffset.bind( this ) );
    
        window.addEventListener( 'scroll', _scrollWatch, false );
    
      }
    
      function _initializeDOM() {
        _upgradeRegistered();
      }
    
    
      // event listeners
      window.addEventListener( 'load', function () {
        _initialize();
        // initialize components and update DOM
        _initializeDOM();
    
        // get/set route
        if ( _routes.length > 0 ) {
          var hash = _hashToId();
    
          if ( !hash || !_elem( hash ) ) {
            window.location.hash = _routes[0].id;
          } else {
            _renderPage( _routeById( hash ), hash );
          }
    
        }
    
        document.body.removeAttribute( 'hidden' );
      } );
    
      window.addEventListener( 'hashchange', function () {
        var id = _hashToId(),
            newId = _routeById( id );
    
        if ( newId ) {
          _renderPage( newId, id );
        }
    
      } );
    
    
      return {
        init: _initialize,
        getComponentInstance: _getComponentInstance,
        register: _register
      };
    
    } )();
    
    
    // debounce
    ( function () {
      'use strict';
    
      var Debounce = function Debounce( callback ) {
        this.callback = callback;
        this.ticking = false;
      };
    
      Debounce.prototype = {
        constructor : Debounce,
    
        update : function () {
          this.callback && this.callback();
          this.ticking = false;
        },
    
        requestTick : function () {
          if ( !this.ticking ) {
            requestAnimationFrame( this.rafCallback || ( this.rafCallback = this.update.bind( this ) ) );
            this.ticking = true;
          }
        },
    
        handleEvent : function () {
          this.requestTick();
        }
    
      };
    
      LMApp['Debounce'] = Debounce;
    
    } )( );
    
    /* ========================================================================
     * Pager
     * ======================================================================== */
    
    ( function () {
      'use strict';
    
      var events = {
        UI_UPDATE: 'uiupdate'
      };
    
    
      var Pager= function Pager( element, obj, root ) {
        if ( element ) {
          this.element = element;
          this.data = obj;
          this._root = root || document;
          this._initialize();
        }
      };
    
    
      Pager.prototype.update = function ( event ) {
        this.element.innerHTML = ( event.detail.index ) + ' / ' + (event.detail.total-1);
      };
    
    
      Pager.prototype._initialize = function () {
        this.id = this.element.getAttribute( 'id' );
    
        this._root.addEventListener( events.UI_UPDATE, this.update.bind( this ) );
      };
    
    
      //register component
      if ( typeof LMApp !== 'undefined' ) {
        LMApp.register( {
          constructor: Pager,
          classAsString: 'Pager',
          selector: '[data-pager]',
          context: 'ui'
        } );
      }
    
    } )();
    
    /* ========================================================================
     * Pagination
     * ======================================================================== */
    
    ( function () {
      'use strict';
    
    
      var events = {
        UI_UPDATE: 'uiupdate'
      };
    
    
      var Pagination = function Pagination( element, obj, root ) {
        if ( element ) {
          this.element = element;
          this.data = obj;
          this._root = root || document;
          this._initialize();
        }
      };
    
    
      Pagination.prototype._initButtons = function () {
        var prevBtn = this.element.querySelector( '[data-prev-page]' ),
            nextBtn = this.element.querySelector( '[data-next-page]' );
    
        this._pageLinks['prev'] = prevBtn;
        this._pageLinks['next'] = nextBtn;
      };
    
    
      Pagination.prototype.update = function ( event ) {
        var index = event.detail.index,
            len = this.data.length,
            prevBtn = this._pageLinks.prev,
            nextBtn = this._pageLinks.next,
            prevObj = this.data[ index - 1 ],
            nextObj = this.data[ index + 1 ],
            prev = ( prevObj ) ? '#' + prevObj.id : '',
            next = ( nextObj ) ? '#' + nextObj.id : '';
    
        // update prev and next buttons
        if ( prevBtn ) {
          prevBtn.hidden = ( index < 2 );
          prevBtn.setAttribute( 'href', prev );
        }
    
        if ( nextBtn ) {
          nextBtn.hidden = ( index >= ( len - 1 ) );
          nextBtn.setAttribute( 'href', next );
        }
    
      };
    
    
      Pagination.prototype._initialize = function () {
        this.id = this.element.getAttribute( 'id' );
        this._pageLinks = {};
        this._initButtons();
        this._root.addEventListener( events.UI_UPDATE, this.update.bind( this ));
      };
    
    
      //register component
      if ( typeof LMApp !== 'undefined' ) {
        LMApp.register( {
          constructor: Pagination,
          classAsString: 'Pagination',
          selector: '[data-pagination]',
          context: 'ui'
        } );
      }
    
    } )();
    
    /* ========================================================================
     * TOC
     * ======================================================================== */
    
    ( function () {
      'use strict';
    
      var cssClasses = {
        LINK: 'toc__link',
        LIST: 'toc__list',
        LANG: 'lang'
      };
    
      var events = {
        UI_UPDATE: 'uiupdate'
      };
    
    
      var TOC = function TOC( el, obj, root ) {
        if ( el ) {
          this.element = el;
          this._data = obj;
          this._root = root || document;
          this._initialize();
        }
      };
    
    
      TOC.prototype._clickHandler = function ( event ) {
    
        if ( event.target.hasAttribute( 'aria-current' ) ) {
          event.preventDefault();
    
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
    
          if ( this.isActive ) {
            this.toggle();
          }
    
        }
    
      };
    
    
      TOC.prototype._createList = function () {
        var arr = this._data,
            ul = document.createElement( 'ol' );
    
        ul.classList.add( cssClasses.LIST );
    
        for ( var i = 1; i < arr.length; i++ ) {
          var obj = arr[i],
              li = document.createElement( 'li' ),
              a = document.createElement( 'a' );
    
          a.setAttribute( 'href', '#' + obj.id );
          a.setAttribute( 'data-localize', obj.dataLocalize);
          a.classList.add( cssClasses.LINK );
          a.classList.add( cssClasses.LANG );
    
          a.appendChild( document.createTextNode( obj.title ) );
          li.appendChild( a );
          ul.appendChild( li );
    
          this._links[obj.id] = a;
          a.addEventListener( 'click', this._clickHandler.bind( this ) );
        }
    
        this.element.appendChild( ul );
      };
    
    
      TOC.prototype._linkControl = function () {
        this._control = document.querySelector( '[aria-controls="' + this.element.id + '"]' );
    
        if ( this._control ) {
          this._control.setAttribute( 'aria-expanded', this.isActive );
          this._control.addEventListener( 'click', this.toggle.bind( this ) );
        }
    
      };
    
    
      TOC.prototype.toggle = function () {
        this.isActive = !this.isActive;
        this.element.classList.toggle( 'open' );
    
        if ( this._control ) {
          this._control.setAttribute( 'aria-expanded', this.isActive );
        }
    
        if ( this.isActive ) {
          this.element.focus();
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
        }
      };
    
    
      TOC.prototype.update = function ( event ) {
        var last = this._links[event.detail.lastId],
            current = this._links[event.detail.currentId];
    
        if ( last ) {
          last.removeAttribute( 'aria-current' );
        }
    
        if ( current ) {
          current.setAttribute( 'aria-current', 'true' );
        }
    
        if ( this.isActive ) {
          this.toggle();
        }
    
      };
    
    
      TOC.prototype._initialize = function () {
        this.id = this.element.getAttribute( 'id' );
        this.isActive = this.element.classList.contains( 'open' );
        this._links = {};
        this._createList();
        this._linkControl();
    
        this._root.addEventListener( events.UI_UPDATE, this.update.bind( this ) );
      };
    
    
      //register component
      if ( typeof LMApp !== 'undefined' ) {
        LMApp.register( {
          constructor: TOC,
          classAsString: 'TOC',
          selector: '[data-toc]',
          context: 'ui'
        } );
      }
    
    } )( );
    
/* ========================================================================
* Accordion
* ======================================================================== */
    let accordionButtons = document.getElementsByClassName('accordion-item__button');
    let isOpen = false;


    for (let i = 0; i < accordionButtons.length; i++) {
        accordionButtons[i].addEventListener('click', function() {
            this.classList.toggle('active');
            isOpen = true;
            let accordionContent = this.nextElementSibling;
            
            if (accordionContent.style.maxHeight) {
                accordionContent.style.maxHeight = null;
            }
            else {
                accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
            }
        });
    }

/* ========================================================================
 * GLossary Link
 * ======================================================================== */

// When the user clicks on word, open the popup
function popFunction() {
  var popup = document.getElementById("myPopup");
  popup.classList.toggle("show");
}
function popFunctionAgain() {
  var popup = document.getElementById("myPopupAgain");
  popup.classList.toggle("show");
}
function popFunction2() {
  var popup = document.getElementById("myPopup2");
  popup.classList.toggle("show");
}
function popFunction3() {
  var popup = document.getElementById("myPopup3");
  popup.classList.toggle("show");
}
function popFunction4() {
  var popup = document.getElementById("myPopup4");
  popup.classList.toggle("show");
}
function popFunction5() {
  var popup = document.getElementById("myPopup5");
  popup.classList.toggle("show");
}
function popFunction6() {
  var popup = document.getElementById("myPopup6");
  popup.classList.toggle("show");
}
function popFunction7() {
  var popup = document.getElementById("myPopup7");
  popup.classList.toggle("show");
}

$(window).load(function () {
  $(".trigger_popup_fricc").click(function(){
     $('.hover_bkgr_fricc').show();
  });
  $('.hover_bkgr_fricc').click(function(){
      $('.hover_bkgr_fricc').hide();
  });
  $('.popupCloseButton').click(function(){
      $('.hover_bkgr_fricc').hide();
  });
});


/* ========================================================================
 * Scroll Button
 * ======================================================================== */

//Get the button:
mybutton = document.getElementById("myBtn");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}


/* ========================================================================
 * Tab Panel
 * ======================================================================== */

 window.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll('[role="tab"]');
  const tabList = document.querySelector('[role="tablist"]');

  // Add a click event handler to each tab
  tabs.forEach(tab => {
    tab.addEventListener("click", changeTabs);
  });

  // Enable arrow navigation between tabs in the tab list
  let tabFocus = 0;

  tabList.addEventListener("keydown", e => {
    // Move right
    if (e.keyCode === 39 || e.keyCode === 37) {
      tabs[tabFocus].setAttribute("tabindex", -1);
      if (e.keyCode === 39) {
        tabFocus++;
        // If we're at the end, go to the start
        if (tabFocus >= tabs.length) {
          tabFocus = 0;
        }
        // Move left
      } else if (e.keyCode === 37) {
        tabFocus--;
        // If we're at the start, move to the end
        if (tabFocus < 0) {
          tabFocus = tabs.length - 1;
        }
      }

      tabs[tabFocus].setAttribute("tabindex", 0);
      tabs[tabFocus].focus();
    }
  });
});

function changeTabs(e) {
  const target = e.target;
  const parent = target.parentNode;
  const grandparent = parent.parentNode;

  // Remove all current selected tabs
  parent
    .querySelectorAll('[aria-selected="true"]')
    .forEach(t => t.setAttribute("aria-selected", false));

  // Set this tab as selected
  target.setAttribute("aria-selected", true);

  // Hide all tab panels
  grandparent
    .querySelectorAll('[role="tabpanel"]')
    .forEach(p => p.setAttribute("hidden", true));

  // Show the selected panel
  grandparent.parentNode
    .querySelector(`#${target.getAttribute("aria-controls")}`)
    .removeAttribute("hidden");
}

    /* ========================================================================
     * Carousel
     * ======================================================================== */
    
    ( function () {
      'use strict';
    
      var idCounter = 0;
    
      var Carousel = function Carousel( element ) {
        if ( element ) {
          this.element = element;
          this._initialize();
        }
      };
    
    
      Carousel.prototype.showSlide = function ( value ) {
        var n = this.currentSlideNum(),
            indexTo = value - 1;
    
        if ( isNaN( value ) || value === n ) {
          return;
        }
    
        this.element.dispatchEvent( new CustomEvent( 'beforemove', { detail: { index: this._index, indexTo: indexTo, total: this._slideCount } } ) );
    
        this._indexFrom = this._index;
        this._index = indexTo;
    
        this._track.style.left = ( this._index * -100 ) + '%';
    
        for ( var i = 0; i < this._slideCount; i++ ) {
          this._slides[i].setAttribute( 'aria-hidden', 'true' );
          this._indicatorBtns[i].disabled = false;
        }
    
        this._slides[this._index].removeAttribute( 'aria-hidden' );
        this._indicatorBtns[this._index].disabled = true;
        this._prevBtn.disabled = ( this._index === 0 );
        this._nextBtn.disabled = ( this._index === ( this._slideCount -1 ) );
    
        this.element.dispatchEvent( new CustomEvent( 'aftermove', { detail: { index: this._index, indexFrom: this._indexFrom, total: this._slideCount } } ) );
      };
    
    
      Carousel.prototype.next = function () {
        var n = this._index + 1;
    
        n = ( n === this._slideCount ) ? 1 : n+1;
        this.showSlide( n );
      };
    
    
      Carousel.prototype.previous = function () {
        var n = this._index + 1;
    
        n = ( n === 1 ) ? this._slideCount : n-1;
        this.showSlide( n );
      };
    
    
      Carousel.prototype.currentSlideNum = function () {
        return this._index + 1;
      };
    
    
      Carousel.prototype._createNav = function () {
        var prevBtn = this.element.querySelector( '[data-prev-slide]' ),
            nextBtn = this.element.querySelector( '[data-next-slide]' );
    
        prevBtn.setAttribute( 'aria-controls', this.id );
        nextBtn.setAttribute( 'aria-controls', this.id );
    
        this._prevBtn = prevBtn;
        this._nextBtn = nextBtn;
      };
    
    
      Carousel.prototype._createIndicators = function () {
        var indicators,
            btns = '';
    
        indicators = document.createElement( 'div' );
        indicators.classList.add( 'carousel__indicators' );
    
        for ( var i = 1; i <= this._slideCount; i++ ) {
          btns += '<button data-slide-to="' + i + '"><span class="visually-hidden">' + i + '</span></button>';
        }
    
        indicators.innerHTML = btns;
    
        this._indicators = indicators;
        this._indicatorBtns = $$( 'button', this._indicators );
        this.element.appendChild( indicators );
      };
    
    
      Carousel.prototype._registerEvents = function () {
        if ( this._prevBtn ) {
          this._prevBtn.addEventListener( 'click', function ( ) {
            this.previous();
          }.bind( this ), false );
        }
    
        if ( this._nextBtn ) {
          this._nextBtn.addEventListener( 'click', function ( ) {
            this.next();
          }.bind( this ), false );
        }
    
        if ( this._indicators ) {
          this._indicators.addEventListener( 'click', function ( event ) {
            var n = parseInt( event.target.getAttribute( 'data-slide-to' ), 10 );
    
            this.showSlide( n );
          }.bind( this ), false );
        }
      };
    
    
      Carousel.prototype._initialize = function () {
        var self = this.element;
    
        idCounter += 1;
        self.setAttribute( 'aria-roledescription', 'carousel' );
    
        if ( !self.hasAttribute( 'id' ) ) {
          self.id = 'carousel-' + idCounter;
        }
    
        this.id = self.id;
        this._track = self.querySelector( '.carousel__items' );
        this._slides = $$( '.carousel__item', this._track );
        this._slideCount = this._slides.length;
        this._index = -1;
        this._indexFrom = -1;
        this._createNav();
        this._createIndicators();
        this._registerEvents();
        this.showSlide( 1 );
      };
    
    
      // Helper Functions
    
      function listToArray( nodeList ) {
        return Array.prototype.slice.call( nodeList );
      }
    
      function $$( selectors, context ) {
        return listToArray( ( context || document ).querySelectorAll( selectors ) );
      }
    
    
      //register component
      if ( typeof LMApp !== 'undefined' ) {
        LMApp.register( {
          constructor: Carousel,
          classAsString: 'Carousel',
          selector: '[data-carousel]'
        } );
      }
    
    } )();
    
    /* ========================================================================
     * Multiple Choice
     * ======================================================================== */
    
    ( function () {
      'use strict';
    
      var MultipleChoice = function MultipleChoice( element ) {
        if ( element ) {
          this.element = element;
          this._initialize();
        }
      };
    
    
      MultipleChoice.prototype.reset = function () {
        var len = this._inputs.length;
    
        this.isCorrect = undefined;
        this.feedbackId = undefined;
    
        for ( var i = 0; i < len; i++ ) {
          this._inputs[i].disabled = false;
          this._inputs[i].checked = false;
        }
      };
    
    
      MultipleChoice.prototype.showFeedback = function () {
        var bool = this.validateAnswer();
    
        var fdbkComp = LMApp.getComponentInstance( this.feedbackId );
    
        if ( fdbkComp ) {
          fdbkComp.show();
        }
      };
    
    
      MultipleChoice.prototype.validateAnswer = function () {
        var len = this._inputs.length;
    
        for ( var i = 0; i < len; i++ ) {
          var el = this._inputs[i];
    
          if ( el.checked ) {
            this.isCorrect = el.getAttribute( 'data-key' );
            this.feedbackId = el.getAttribute( 'data-feedback' );
    
            if ( this.isCorrect || this.isScored ) {
              this._updateState();
            }
    
            return true;
    
          }
        }
    
        return false;
    
      };
    
    
      MultipleChoice.prototype._setDisabled = function ( element, value ) {
        element.disabled = value;
      };
    
    
      MultipleChoice.prototype._updateState = function () {
        var len = this._inputs.length;
    
        for ( var i = 0; i < len; i++ ) {
          this._setDisabled( this._inputs[i], true );
        }
    
      };
    
    
      MultipleChoice.prototype._initialize = function () {
        var self = this.element;
    
        this.id = self.getAttribute( 'id' );
        this.isCorrect = undefined;
        this.isScored = false;
        this.feedbackId = '';
        this._inputs = $$( 'input', self );
      };
    
    
      // Helper Functions
    
      function listToArray( nodeList ) {
        return Array.prototype.slice.call( nodeList );
      }
    
      function $$( selectors, context ) {
        return listToArray( ( context || document ).querySelectorAll( selectors ) );
      }
    
    
      //register component
      if ( typeof LMApp !== 'undefined' ) {
        LMApp.register( {
          constructor: MultipleChoice,
          classAsString: 'MultipleChoice',
          selector: '[data-multiple-choice]'
        } );
      }
    
    } )();
    
    /* ========================================================================
     * Multiple Select
     * ======================================================================== */
    
    ( function () {
      'use strict';
    
      var MultipleSelect = function MultipleSelect( element ) {
        if ( element ) {
          this.element = element;
          this._initialize();
        }
      };
    
    
      MultipleSelect.prototype.reset = function () {
        var len = this._inputs.length;
    
        this.isCorrect = undefined;
        this.feedbackId = undefined;
    
        for ( var i = 0; i < len; i++ ) {
          this._inputs[i].disabled = false;
          this._inputs[i].checked = false;
        }
      };
    
    
      MultipleSelect.prototype.showFeedback = function () {
        var bool = this.validateAnswer(),
            fbbkId;
    
        if ( this.isCorrect ) {
          fbbkId = this._correctFdbkId;
        } else {
          fbbkId = this._incorrectFdbkId;
        }
    
        var fdbkComp = LMApp.getComponentInstance( fbbkId );
    
        if ( fdbkComp ) {
          fdbkComp.show();
        }
      };
    
    
      MultipleSelect.prototype.validateAnswer = function () {
        var len = this._inputs.length,
            oneChecked = false,
            totalKeys = 0,
            totalCorrect = 0,
            totalIncorrect = 0;
    
        for ( var i = 0; i < len; i++ ) {
          var el = this._inputs[i],
              isKey = el.getAttribute( 'data-key' ),
              isChecked = el.checked;
    
          if ( isKey ) { totalKeys++; }
    
          if ( isChecked ) { oneChecked = true; }
    
          if ( isChecked && isKey ) {
            totalCorrect++;
          } else if ( ( !isChecked && isKey ) || ( isChecked && !isKey ) ) {
            totalIncorrect++;
          }
    
        }
    
        if ( oneChecked ) {
    
          this.isCorrect = ( ( totalCorrect === totalKeys ) && ( totalIncorrect === 0 ) );
    
          if ( this.isCorrect || this.isScored ) {
            this._updateState();
          }
    
          return true;
    
        }
    
        return false;
    
      };
    
    
      MultipleSelect.prototype._setDisabled = function ( element, value ) {
        element.disabled = value;
      };
    
    
      MultipleSelect.prototype._updateState = function () {
        var len = this._inputs.length;
    
        for ( var i = 0; i < len; i++ ) {
          this._setDisabled( this._inputs[i], true );
        }
    
      };
    
    
      MultipleSelect.prototype._initialize = function () {
        var self = this.element;
    
        this.id = self.getAttribute( 'id' );
        this.isCorrect = undefined;
        this.isScored = false;
        this._correctFdbkId = self.getAttribute( 'data-feedback-correct' );
        this._incorrectFdbkId = self.getAttribute( 'data-feedback-incorrect' );
        this._inputs = $$( 'input', self );
      };
    
    
      // Helper Functions
    
      function listToArray( nodeList ) {
        return Array.prototype.slice.call( nodeList );
      }
    
      function $$( selectors, context ) {
        return listToArray( ( context || document ).querySelectorAll( selectors ) );
      }
    
    
      //register component
      if ( typeof LMApp !== 'undefined' ) {
        LMApp.register( {
          constructor: MultipleSelect,
          classAsString: 'MultipleSelect',
          selector: '[data-multiple-select]'
        } );
      }
    
    } )();
    
    /* ========================================================================
     * Quiz
     * ======================================================================== */
    
    ( function () {
      'use strict';
    
    
      var Quiz = function Quiz( element ) {
        if ( element ) {
          this.element = element;
          this._initialize();
        }
      };
    
    
      Quiz.prototype.activeQuestionObj = function () {
        var id = this._questions[this._index].id;
    
        return LMApp.getComponentInstance( id );
      };
    
    
      Quiz.prototype.check = function () {
        var q_obj = this.activeQuestionObj();
        var isLast = ( this.currentQuestionNum() === this.totalQuestions() );
        var isScored = this.isScored;
        var isSelected = false;
    
        this.element.focus();
    
        if ( q_obj ) {
          isSelected = q_obj.validateAnswer();
        }
    
        if ( isSelected ) {
    
          if ( q_obj.isCorrect && isScored ) {
            this.masteryScore++;
          }
    
          if ( ( q_obj.isCorrect || isScored )  && isLast ) {
            this._checkBtn.hidden = true;
            this._resetBtn.hidden = false;
            this.showFeedback();
          } else if ( q_obj.isCorrect || isScored ) {
            this._checkBtn.hidden = true;
            this._nextBtn.hidden = false;
          }
    
          q_obj.showFeedback();
        }
    
      };
    
    
      Quiz.prototype.currentQuestionNum = function () {
        return this._index + 1;
      };
    
    
      Quiz.prototype.next = function () {
        var n = this._index + 1;
    
        n = ( n === this._questions.length ) ? 1 : n+1;
        this.showQuestion( n );
      };
    
    
      Quiz.prototype.reset = function () {
        var len = this.totalQuestions();
    
        for ( var i = 0; i < len; i++ ) {
          var id = this._questions[i].id;
          var obj = LMApp.getComponentInstance( id );
    
          obj.isScored = this.isScored;
          obj.reset();
        }
    
        this.element.setAttribute( 'data-success', '' );
        this.masteryScore = 0;
    
        this.showQuestion( 1 );
      };
    
    
      Quiz.prototype.showFeedback = function () {
    
        if ( this.isScored ) {
    
          this._scoreEl.innerHTML = this.masteryScore + ' / ' + this.totalQuestions();
    
          if ( this.masteryScore >= this.masteryTarget ) {
            this.element.setAttribute( 'data-success', '1' );
          } else {
            this.element.setAttribute( 'data-success', '0' );
          }
    
        }
    
      };
    
    
      Quiz.prototype.showQuestion = function ( value ) {
        var len = this.totalQuestions();
    
        for ( var i = 0; i < len; i++ ) {
          this._questions[i].hidden = true;
        }
    
        this._index = value -1;
        this._questions[this._index].hidden = false;
        this._updateCounter();
        this._checkBtn.hidden = false;
        this._nextBtn.hidden = true;
        this._resetBtn.hidden = true;
        this.element.focus();
        this.element.dispatchEvent( new CustomEvent( 'questionChange' ) );
      };
    
    
      Quiz.prototype.totalQuestions = function () {
        return this._questions.length;
      };
    
    
      Quiz.prototype._updateCounter = function () {
        this._counterEl.innerHTML = this.currentQuestionNum() + ' / ' + this._questions.length;
      };
    
    
      Quiz.prototype._registerEvents = function () {
        this._checkBtn.addEventListener( 'click', this.check.bind( this ) );
        this._nextBtn.addEventListener( 'click', this.next.bind( this ) );
        this._resetBtn.addEventListener( 'click', this.reset.bind( this ) );
      };
    
    
      Quiz.prototype._initialize = function () {
        var self = this.element;
    
        self.setAttribute( 'tabindex', '-1' );
        self.setAttribute( 'data-success', '' );
    
        this.id = self.getAttribute( 'id' );
        this.masteryScore = 0;
        this.masteryTarget = self.getAttribute( 'data-mastery-target' );
        this.isScored = ( this.masteryTarget ) ? true : false;
    
        this._index = -1;
        this._questions = $$( '.question', self );
        this._counterEl = self.querySelector( '[data-quiz-counter]' );
        this._checkBtn = self.querySelector( '[data-quiz-check]' );
        this._nextBtn = self.querySelector( '[data-quiz-next]' );
        this._resetBtn = self.querySelector( '[data-quiz-reset]' );
        this._feedbackEl = self.querySelector( '.data-quiz__feedback' );
        this._scoreEl = self.querySelector( '[data-quiz-score]' );
    
        this._nextBtn.hidden = true;
        this._resetBtn.hidden = true;
    
        this._registerEvents();
        //this.showQuestion( 1 );
        this.reset();
      };
    
    
      // Helper Functions
    
      function listToArray( nodeList ) {
        return Array.prototype.slice.call( nodeList );
      }
    
      function $$( selectors, context ) {
        return listToArray( ( context || document ).querySelectorAll( selectors ) );
      }
    
    
      //register component
      if ( typeof LMApp !== 'undefined' ) {
        LMApp.register( {
          constructor: Quiz,
          classAsString: 'Quiz',
          selector: '[data-quiz]'
        } );
      }
    
    } )();
    
    
    

/* ========================================================================
 * Flipcard
 * ======================================================================== */

HTMLElement.prototype.swapClasses = function (dosclasses) {
  var clases = dosclasses.split(/\s*\,\s*/);
  var entra = clases[0];
  var sale = clases[1];
  if (this.classList.contains(sale)) {
      this.classList.remove(sale);
      this.classList.add(entra);
  } else {
      this.classList.remove(entra);
      this.classList.add(sale);
  }
  return this;
};


    
    /* ========================================================================
     * Modal
     * ======================================================================== */
    
    ( function () {
      'use strict';
    
      var _lastFocus,
          _container,
          _baseChildren,
          _active;
    
      var FOCUSABLE_ELEMENTS = [
        'a[href]:not([tabindex^="-"]):not([inert])',
        'area[href]:not([tabindex^="-"]):not([inert])',
        'input:not([disabled]):not([inert])',
        'select:not([disabled]):not([inert])',
        'textarea:not([disabled]):not([inert])',
        'button:not([disabled]):not([inert])',
        'iframe:not([tabindex^="-"]):not([inert])',
        'audio:not([tabindex^="-"]):not([inert])',
        'video:not([tabindex^="-"]):not([inert])',
        '[contenteditable]:not([tabindex^="-"]):not([inert])',
        '[tabindex]:not([tabindex^="-"]):not([inert])'
      ];
    
      var TAB_KEY = 9,
          ESCAPE_KEY = 27;
    
      var Modal = function Modal( element ) {
        if ( element ) {
          this.element = element;
          this._initialize();
        }
      };
    
    
      Modal.prototype.hide = function () {
    
        if ( !this.isActive ) {
          return this;
        }
    
        this.element.dispatchEvent( new CustomEvent( 'hide' ) );
    
        // remove body class
        document.body.classList.remove( 'modal-open' );
    
        this.element.hidden = true;
        this.element.scrollTop = 0;
        _container.hidden = true;
        this.isActive = false;
        _active = undefined;
    
        toggleChildren( false );
    
        if ( _lastFocus ) {
          _lastFocus.focus();
          _lastFocus = undefined;
        }
    
        document.removeEventListener( 'keydown', this._keydownHandler );
      };
    
    
      Modal.prototype.show = function () {
        if ( this.isActive ) {
          return this;
        }
    
        _lastFocus = document.activeElement;
    
        // add class to body
        document.body.classList.add( 'modal-open' );
    
        this.element.hidden = false;
        _container.hidden = false;
        this.isActive = true;
        _active = this;
        this.element.focus();
    
        toggleChildren( true );
    
        document.addEventListener( 'keydown', this._keydownHandler );
        this.element.dispatchEvent( new CustomEvent( 'show' ) );
      };
    
    
      Modal.prototype._addCloseButton = function ( ) {
        var el = this.element.querySelector( '[data-modal-hide]' );
    
        if ( !el ) {
          el = document.createElement( 'button' );
          el.classList.add( 'icon-button' );
          el.classList.add( 'close-button' );
          el.setAttribute( 'aria-label', 'close' );
          el.setAttribute( 'data-modal-hide', '' );
          el.innerHTML = '<svg aria-hidden="true"><use href="#icon-close" xlink:href="#icon-close"/></svg>';
          this.element.appendChild( el );
        }
      };
    
    
      Modal.prototype._keydownHandler = function ( event ) {
        var keyCode  = event.keyCode || event.which;
    
        if ( this.isActive && keyCode === ESCAPE_KEY ) {
          event.preventDefault();
          this.hide();
        }
    
        if ( this.isActive && keyCode === TAB_KEY ) {
          trapTabKey( this.element, event );
        }
      };
    
    
      Modal.prototype._registerEvents = function () {
        var i = 0,
            len = -1;
    
        this._showers = $$( '[data-modal-show="' + this.element.id + '"]' );
        len = this._showers.length;
    
        for ( i = 0; i < len; i++ ) {
          this._showers[i].addEventListener( 'click', function ( event ) {
            event.preventDefault();
            this.show();
          }.bind( this ), false );
        }
    
        this._hiders = $$( '[data-modal-hide]', this.element );
        len = this._hiders.length;
    
        for ( i = 0; i < len; i++ ) {
          this._hiders[i].addEventListener( 'click', function ( event ) {
            event.preventDefault();
            this.hide();
          }.bind( this ), false );
        }
      };
    
    
      Modal.prototype._initialize = function () {
        var self = this.element;
    
        self.setAttribute( 'role', 'dialog' );
        self.setAttribute( 'tabindex', '-1' );
        self.hidden = true;
    
        this.id = self.id;
        this.isActive = false;
        this._addCloseButton();
    
        if ( !_container ) {
          _container = createModalContainer( 'modal-container' );
        }
        _container.appendChild( self );
    
        if ( !_baseChildren ) {
          _baseChildren = document.querySelectorAll( 'body > *:not(#modal-container)' );
        }
    
        this._keydownHandler = this._keydownHandler.bind( this );
        this._registerEvents();
    
      };
    
      // Helper Functions
    
      function $$( selectors, context ) {
        return Array.prototype.slice.call( ( context || document ).querySelectorAll( selectors ) );
      }
    
      function getFocusableChildren( node ) {
        return $$( FOCUSABLE_ELEMENTS.join( ',' ), node ).filter( function ( child ) {
          return !!( child.offsetWidth || child.offsetHeight || child.getClientRects().length );
        } );
      }
    
      function trapTabKey( node, event ) {
        var focusableChildren = getFocusableChildren( node );
        var focusedItemIndex = focusableChildren.indexOf( document.activeElement );
    
        if ( focusedItemIndex < 0 || focusedItemIndex > focusableChildren.length - 1 ) {
          focusableChildren[0].focus();
          event.preventDefault();
        } else if ( event.shiftKey && focusedItemIndex === 0 ) {
          focusableChildren[focusableChildren.length - 1].focus();
          event.preventDefault();
        } else if ( !event.shiftKey && focusedItemIndex === focusableChildren.length - 1 ) {
          focusableChildren[0].focus();
          event.preventDefault();
        }
      }
    
      function toggleChildren( bool ) {
    
        for ( var i = 0; i < _baseChildren.length; i++ ) {
          _baseChildren[i].setAttribute( 'aria-hidden', bool );
        }
    
      }
    
    
      function createModalContainer( id ) {
        var el = document.getElementById( id ),
            el2;
    
        if ( !el ) {
          el = document.createElement( 'div' );
          el.setAttribute( 'id', id );
          el.classList.add( 'modal-container' );
          el.hidden = true;
    
          document.body.appendChild( el );
    
          el2 = document.createElement( 'div' );
          el2.classList.add( 'modal-backdrop' );
    
          el.appendChild( el2 );
    
          el2.addEventListener( 'click', function () {
            _active.hide();
          } );
        }
    
        return el;
      }
    
      //register component
      if ( typeof LMApp !== 'undefined' ) {
        LMApp.register( {
          constructor: Modal,
          classAsString: 'Modal',
          selector: '[data-modal]'
        } );
      }
    
    } )();
    