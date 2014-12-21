# Tipe: a very simple model library

Tipe is an experiment in building a very simple library for building javascript
business models.

## Installation

You can install Tipe with NPM:

```
% npm install tipe
```

Then you can `require` it in your code:

```js
var Tipe = require('tipe');
```

## Documentation

See the [annotated source code](http://avdgaag.github.io/tipe).

## Usage

You can define models by extending `Tipe.Model` and defining your model schema
in a callback function:

```js
var Person = Tipe.Model.extend(function(attr) {
  attr.accessor('firstName');
  attr.accessor('lastName');
  attr.property('fullName', {
    serialize: false,
    get: function() {
      return this.firstName + ' ' + this.lastName;
    }
  });
  attr.accessor('age', {
    default: 20,
    serialize: function(val) {
      return val * 2;
    },
    set: function(val) {
      this.attributes.age = parseInt(val);
    }
  });
});
```

This `Person` model has four attributes:

* `firstName`
* `lastName`
* `fullName` (read-only, computed based on `firstName` and `lastName` and not
  included in any JSON representation)
* `age` (defaults to 20, parsed to integer when set and doubled in JSON
  representation)

You can use it as follows:

```js
var john = new Person({ firstName: 'John' });
john.lastName = 'Cleese';
console.log(john.firstName);
// => 'John'
console.log(john.fullName);
// => 'John Cleese'
console.log(john.age);
// => 20
console.log(john.toJSON());
// => { firstName: 'John', lastName: 'Cleese', age: 40 }
```

## Credits

Author: Arjan van der Gaag  
Email: arjan@arjanvandergaag.nl  
URL: http://github.com/avdgaag/tipe  

Released under a MIT license. See LICENSE for more information.
