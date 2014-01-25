// Module `base` menyediakan mixin dasar yang akan dimiliki oleh semua
// komponen FlightJS.
define(

  [
    './utils',
    './registry',
    './debug'
  ],

  function(utils, registry, debug) {
    'use strict';

    var componentId = 0;

    function teardownInstance(instanceInfo){
      instanceInfo.events.slice().forEach(function(event) {
        var args = [event.type];

        event.element && args.unshift(event.element);
        (typeof event.callback == 'function') && args.push(event.callback);

        this.off.apply(this, args);
      }, instanceInfo.instance);
    }

    function checkSerializable(type, data) {
      try {
        window.postMessage(data, '*');
      } catch(e) {
        console.log('unserializable data for event',type,':',data);
        throw new Error(
          ['The event', type, 'on component', this.toString(), 'was triggered with non-serializable data'].join(' ')
        );
      }
    }

    // ### withBase
    function withBase() {

      // ### trigger
      // 
      // Mempublikasikan event. Ketika sebuah event dibangkitkan,
      // ia akan dibangkitkan pada suatu element tertentu. Pada
      // element apa suatu event akan dibangkitkan tergantung
      // pada bagaimana metode `trigger` dijalankan.
      // 
      // Ada beberapa contoh bagaimana menjalankan
      // `trigger()`:
      // 
      // #### Cara Pertama
      // 
      // ```javascript
      // function saveDocument() {
      //    this.save = function() {
      //        this.trigger('documentSaved', savedDocument);
      //    }
      // }
      // ```
      // Contoh di atas akan mempublikasikan event `documentSaved` dengan
      // *event data* berupa `savedDocument`. Event tersebut akan dibangkitkan
      // pada element dimana komponen di atas diinisiasi.
      // 
      // Misalnya, komponen `SaveDocument` diinisiasi pada element dengan
      // id berupa `save-document`:
      // 
      // ```javascript
      // saveDocument.attachTo('#save-document')
      // ```
      // 
      // Maka berdasarkan contoh di atas, event `documentSaved` akan
      // dibangkitkan pada element `#save-document`.
      // 
      // #### Cara Kedua
      // 
      // ```javascript
      // function saveDocument() {
      //    this.save = function() {
      //        this.trigger(document, 'documentSaved', savedDocument);
      //    }
      // }
      // ```
      // 
      // Contoh di atas tidaklah jauh berbeda dengan contoh sebelumnya. Yang
      // berbeda hanyalah pada element apa event `documentSaved` dipublikasikamn.
      // Pada contoh ini, event `documentSaved` akan dibangkitkan pada element
      // `document`.
      // 
      // Jadi, suatu event (parameter kedua), akan dibangkitkan pada element
      // yang menduduki posisi parameter pertama.
      // 
      // #### Cara Ketiga
      // 
      // ```javascript
      // this.trigger('#textInput', {
      //   type: 'escapePressed',
      //   defaultBehavior: this.blur
      // });
      // ```
      // 
      // **TODO** Jelaskan
      this.trigger = function() {

        // Karena ada beberapa bentuk dalam menggunakan metode `trigger` ini,
        // maka kita perlu mengambil `arguments` secara manual.
        var $element, type, data, event, defaultFn;
        var lastIndex = arguments.length - 1, lastArg = arguments[lastIndex];

        // Memeriksa apakah argument terakhir dari metode ini adalah sebuah
        // event data atau bukan.
        // 
        // Cara menentukanny adalah:
        // 
        // 1. Apakah `lastArg` bertipekan `string` atau bukan. Ingat bahwa
        if (typeof lastArg != 'string' && !(lastArg && lastArg.defaultBehavior)) {
          lastIndex--;
          data = lastArg;
        }

        // Format `trigger` ini memiliki argument:
        // 
        // 1. `element`: element dimana event akan dibangkitkan
        // 2. `event`: event yang hendak dibangkitkan
        if (lastIndex == 1) {

          // element dimana event akan dibangkitkan
          $element = $(arguments[0]);

          // rekam event
          event = arguments[1];
        } else {
          // Format `trigger` ini memiliki argument berikut:
          // 
          // 1. `event`: nama event
          // 
          // Di element mana event akan dibangkitkan? Event akan
          // dibangkitkan pada element dimana komponen diinisiasi.

          // element yang akan membangkitkan event ini adalah
          // element dimana komponen diinisiasi
          $element = this.$node;

          // yang akan menjadi event data
          event = arguments[0];
        }

        if (event.defaultBehavior) {
          defaultFn = event.defaultBehavior;
          event = $.Event(event.type);
        }

        type = event.type || event;

        // Jika mode *debug* di aktifkan, maka kita
        // dapat memeriksa apakah *event data* yang 
        // disertakan pada event ini bertipekan objek
        // literal.
        if (debug.enabled && window.postMessage) {
          checkSerializable.call(this, type, data);
        }

        // Bila komponen yang men-`trigger` event ini memiliki
        // `attribute` berupa `eventData`, maka kita akan menggunakan
        // data yang dipasang padanya sebagai tambahan untuk data
        // yang disertkan ketika event dibangkitkan.
        if (typeof this.attr.eventData === 'object') {
          data = $.extend(true, {}, this.attr.eventData, data);
        }

        // Mempublikasikan event
        $element.trigger((event || type), data);

        // Jalankan default function
        if (defaultFn && !event.isDefaultPrevented()) {
          (this[defaultFn] || defaultFn).call(this);
        }

        return $element;
      };

      // ### on
      // Mendengarkan event yang telah dibangkitkan oleh komponen lain
      this.on = function() {

        // Karena ada beberapa bentuk dalam menggunakan metode `trigger` ini,
        // maka kita perlu mengambil `arguments` secara manual.
        // 
        // Ada beberapa cara misalnya:
        // 
        // #### Bentuk pertama
        // 
        // ```javascript
        // this.on(document, 'dataSent', this.refreshList);
        // ```
        // 
        // Contoh di atas memanfaatkan metode `on` untuk mendengarkan event 
        // `dataSent` dari `document`. Ketika event telah dibangkitkan, maka
        // kita menjalankan metode `refreshList`.
        // 
        // #### Bentuk kedua
        // 
        // ```javascript
        // this.on('dataSent', this.refreshList);
        // ```
        // 
        // Metode di atas menandakan bahwa ketika event `dataSent` dibangkitkan
        // pada element dimana komponen di atas diinisiasi, maka jalankan
        // `refreshList`.
        // 
        // Contoh, bila komponen di atas diinisiasi dengan cara berikut:
        // 
        // ```
        // contohElement.attachTo('#send-data');
        // ```
        // 
        // Maka, metode `this.on('dataSent', this.refreshList);` akan mendengarkan
        // event `dataSent` pada element `#send-data`.
        // 
        // #### Bentuk Ketiga
        // 
        // ```
        // this.after('initialize', function() {
        //   this.on('click', {
        //     menuItemSelector: this.selectMenuItem,
        //     saveButtonSelector: this.saveAll
        //   });
        // });
        // ```
        // 
        // Bentuk ketiga di atas hanya akan berjalan bila pada komponen ini,
        // `attribute` memiliki properti `menuItemSelector` dan `saveButtonSelector`.
        // Contohnya adalah sebagai berikut:
        // 
        // ```
        // this.defaultAttrs({
        //   menuItemSelector: '.menuItem',
        //   saveButtonSelector: '#save'
        // });
        // ```
        // 
        // Jadi, berdasarkan contoh di atas, event handler `this.selectMenuItem`
        // akan dijalankan ketika event `click` dibangkitkan pada
        // element `.menutItem`. Sementara itu, event handler
        // `this.saveAll` akan dijalankan ketika event `click` dibangkitkan
        // pada element `#save`.
        var $element, type, callback, originalCb;
        var lastIndex = arguments.length - 1, origin = arguments[lastIndex];

        if (typeof origin == 'object') {
          //delegate callback
          originalCb = utils.delegate(
            this.resolveDelegateRules(origin)
          );
        } else {
          originalCb = origin;
        }

        if (lastIndex == 2) {
          $element = $(arguments[0]);
          type = arguments[1];
        } else {
          $element = this.$node;
          type = arguments[0];
        }

        if (typeof originalCb != 'function' && typeof originalCb != 'object') {
          throw new Error('Unable to bind to "' + type + '" because the given callback is not a function or an object');
        }

        callback = originalCb.bind(this);
        callback.target = originalCb;
        callback.context = this;

        $element.on(type, callback);

        // store every bound version of the callback
        originalCb.bound || (originalCb.bound = []);
        originalCb.bound.push(callback);

        return callback;
      };

      // ### off
      // 
      // Berhenti mendengarkan suatu `event` pada `element` tertentu.
      // 
      // Bentuknya adalah sebagai berikut:
      // 
      // ```
      // this.off(document, 'save'. this.onSave);
      // ```
      // 
      // Parameter pada contoh di atas adalah:
      // 
      // 1. `element`: event ini dibangkitkan di element apa?
      // 2. `event`: nama event yang hendak berhenti didengarkan
      // 3. `eventHandler`: event handler yang hendak berhenti dijalankan.
      // 
      // Parameter 1 dan 3 sifatnya opsional. Bila parameter 1 tidak disertakan,
      // berarti element yang memiliki `event` adalah element yang
      // dipasangkan terhadap komponen ketika komponen di-inisiasi.
      // 
      // Bila parameter 3 **disertakan**, maka hanya `eventHandler` ini saja yang
      // akan berhenti dijalankan ketika `event` dibangkitkan pada `element`.
      // Bila parameter 3 **tidak disertakan**, maka semua event handler
      // di-non-aktifkan.
      this.off = function() {
        var $element, type, callback;
        var lastIndex = arguments.length - 1;

        if (typeof arguments[lastIndex] == 'function') {
          callback = arguments[lastIndex];
          lastIndex -= 1;
        }

        if (lastIndex == 1) {
          $element = $(arguments[0]);
          type = arguments[1];
        } else {
          $element = this.$node;
          type = arguments[0];
        }

        if (callback) {
          //set callback to version bound against this instance
          callback.bound && callback.bound.some(function(fn, i, arr) {
            if (fn.context && (this.identity == fn.context.identity)) {
              arr.splice(i, 1);
              callback = fn;
              return true;
            }
          }, this);
        }

        return $element.off(type, callback);
      };

      this.resolveDelegateRules = function(ruleInfo) {
        var rules = {};

        Object.keys(ruleInfo).forEach(function(r) {
          if (!(r in this.attr)) {
            throw new Error('Component "' + this.toString() + '" wants to listen on "' + r + '" but no such attribute was defined.');
          }
          rules[this.attr[r]] = ruleInfo[r];
        }, this);

        return rules;
      };

      this.defaultAttrs = function(defaults) {
        utils.push(this.defaults, defaults, true) || (this.defaults = defaults);
      };

      this.select = function(attributeKey) {
        return this.$node.find(this.attr[attributeKey]);
      };

      this.initialize = function(node, attrs) {
        attrs || (attrs = {});
        //only assign identity if there isn't one (initialize can be called multiple times)
        this.identity || (this.identity = componentId++);

        if (!node) {
          throw new Error('Component needs a node');
        }

        if (node.jquery) {
          this.node = node[0];
          this.$node = node;
        } else {
          this.node = node;
          this.$node = $(node);
        }

        // merge defaults with supplied options
        // put options in attr.__proto__ to avoid merge overhead
        var attr = Object.create(attrs);
        for (var key in this.defaults) {
          if (!attrs.hasOwnProperty(key)) {
            attr[key] = this.defaults[key];
          }
        }

        this.attr = attr;

        Object.keys(this.defaults || {}).forEach(function(key) {
          if (this.defaults[key] === null && this.attr[key] === null) {
            throw new Error('Required attribute "' + key + '" not specified in attachTo for component "' + this.toString() + '".');
          }
        }, this);

        return this;
      };

      this.teardown = function() {
        teardownInstance(registry.findInstanceInfo(this));
      };
    }

    return withBase;
  }
);
