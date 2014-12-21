// © 2014 Arjan van der Gaag
// Released under the MIT license.
// More information: http://avdgaag.github.io/tipe

// Define Tipe either as a CommonJS module or a browser global. If need be,
// we can also define setup as an AMD module.
(function(root, factory) {
  if(typeof exports !== 'undefined') {
    factory(root, exports);
  } else {
    root.Tipe = factory(this, {});
  }
})(this, function(root, Tipe) {
  'use strict';

  // Utilities
  // ---------

  // Keep references to generic functions we need later.
  var __hasOwn = Object.prototype.hasOwnProperty;
  var __slice = Array.prototype.slice;

  // Generic `extend` function to merge objects together. Accepts two or more
  // arguments, with all arguments being combined into the first.
  function extend(first) {
    var others = __slice.call(arguments, 1);
    return others.reduce(function(previous, current) {
      for(var key in current) {
        if(__hasOwn.call(current, key)) {
          previous[key] = current[key];
        }
      }
      return previous;
    }, first);
  }

  // Inheritence function to set up the appropriate constructor and protoypes
  // to enable inheriting from Tipe.Model.
  function inherits(child, parent) {
    extend(child, parent);
    function Ctor() {
      this.constructor = child;
    }
    Ctor.prototype = parent.prototype;
    child.prototype = new Ctor();
    child.__super__ = parent.prototype;
    return child;
  }

  // Model
  // -----

  // The `Model` constructor is the base for your custom Tipe models. It is
  // defined with a schema definition and can then be used like any other plain
  // javascript object. Tipe models tend to have very little behaviour and are
  // mostly simple containers of data.
  //
  // You can define the model schema using a callback function that will be
  // passed to `Schema`, so you can define a trivial `Person` model like so:
  //
  //     var Person = Tipe.Model.extend(function(attr) {
  //       attr.accessor('firstName');
  //       attr.accessor('lastName');
  //       attr.property('fullName', {
  //         get: function() {
  //           return this.firstName + ' ' + this.lastName;
  //         }
  //       });
  //     });
  //
  // Having defined such a model, you can instantiate and use it like
  // regular Javascript objects:
  //
  //     var john = new Person({ firstName: 'John', lastName: 'Cleese' });
  //     john.firstName // => 'John'
  //     john.lastName  // => 'Cleese'
  //     john.fullName  // => 'John Cleese'
  //     john.firstName = 'Graham';
  //     john.fullName // => 'Graham Cleese'
  //
  var Model = (function() {
    function Model(attributes) {
      this.attributes = this.constructor.schema.attributesWithDefaults();
      this.update(attributes);
    }

    extend(Model.prototype, {
      // Update a model's attributes from a given set of keys and values.
      update: function(attributes) {
        for(var key in attributes) {
          if(__hasOwn.call(attributes, key) && !this.constructor.schema.hasAttribute(key)) {
            throw new Error('No such attribute: ' + key);
          }
        }
        extend(this, attributes);
      },

      // Create a JSON representation of this model, taking into account the
      // schema definition to skip or process certain properties. This results
      // in a javascript object that can be stringified, not an actual string
      // of JSON content.
      //
      // To omit model attributes from its JSON representation, define the
      // attribute with a `serialize: false` option. To alter how it is
      // serialized, provide a function to the `serialize` option.
      toJSON: function() {
        var json = {};
        this.constructor.schema.forEach(function(name, attribute) {
          if(!attribute.serialize) return;
          if(typeof attribute.serialize === 'function') {
            json[name] = attribute.serialize(this[name]);
          } else {
            json[name] = this[name];
          }
        }, this);
        return json;
      }
    });

    // Create a new subclass of Model for your own purposes, providing a
    // callback function to define its schema. The callback function will
    // receive a `Schema` object on which you can call `reader`, `writer` and
    // `accessor` methods.
    //
    // This returns a constructor function that you can use to instantiate a
    // model object.
    Model.extend = function(fn) {
      inherits(Constructor, Model);
      function Constructor() {
        Model.apply(this, arguments);
      }
      Constructor.schema = new Schema(fn);
      Object.defineProperties(
        Constructor.prototype,
        Constructor.schema.attributes
      );
      return Constructor;
    };

    return Model;
  })();

  // The Schema object holds property definitions. Properties are model names
  // combined with options that `Object.defineProperty` will understand. You
  // can define `reader`, `writer` and `accessor` properties, or use the
  // generic `property` method to craft your own.
  //
  // Usage:
  //
  //     var schema = new Schema(function(attr) {
  //       attr.reader('name');
  //     });
  //
  var Schema = (function() {
    function Schema(fn) {
      this.attributes = {};
      fn(this);
    }

    extend(Schema.prototype, {
      // Loop over all attributes in the schema and call fn
      // for each attribute definition.
      forEach: function(fn, context) {
        for(var attr in this.attributes) {
          if(__hasOwn.call(this.attributes, attr)) {
            fn.call(context, attr, this.attributes[attr]);
          }
        }
      },

      // Test if the schema currently has a property by a given name.
      hasAttribute: function(name) {
        return name in this.attributes;
      },

      // Provides an empty set of attributes for a model to track its
      // contents in and pre-fills it with any default values defined
      // in the schema.
      attributesWithDefaults: function() {
        var all = {};
        this.forEach(function(name, attribute) {
          if(attribute.default) {
            all[name] = attribute.default;
          }
        });
        return all;
      },

      // Define a generic property that is by default enumerable and
      // serializable. You can override any options `Object.defineProperty`
      // understands.
      property: function(name, definition) {
        this.attributes[name] = extend({}, {
          enumerable: true,
          serialize: true
        }, definition);
      },

      // Define a standard read-only property that delegates to a model's
      // internal `attributes` object to look up its value.
      reader: function(name, definition) {
        this.property(name, extend({}, {
          get: function() { return this.attributes[name]; }
        }, definition));
      },

      // Define a standard write-only property that delegates to a model's
      // internal `attributes` object to store its value.
      writer: function(name, definition) {
        this.property(name, extend({}, {
          set: function(newVal) { this.attributes[name] = newVal; }
        }, definition));
      },

      // Combination of `reader` and `writer` to define a property that can
      // both be read and written to, delegating storage to the internal
      // `attributes` property of the model.
      accessor: function(name, definition) {
        this.property(name, extend({}, {
          get: function() { return this.attributes[name]; },
          set: function(newVal) { this.attributes[name] = newVal; }
        }, definition));
      }
    });

    return Schema;
  }());

  // Provide the Model constructor in the Tipe namespace.
  Tipe.Model = Model;

  return Tipe;
});
