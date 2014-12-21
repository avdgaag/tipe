describe('Tipe', function() {
  var Tipe = require('../src/tipe');
  var Person;
  var john;

  beforeEach(function() {
    Person = Tipe.Model.extend(function(attr) {
      attr.accessor('firstName');
      attr.accessor('lastName');
      attr.accessor('age', {
        default: 10,
        serialize: function(val) {
          return val * 2;
        },
        set: function(val) {
          this.attributes.age = parseInt(val);
        }
      });
      attr.property('fullName', {
        serialize: false,
        get: function() {
          return this.firstName + ' ' + this.lastName;
        }
      });
    });
    john = new Person({
      firstName: 'John',
      lastName: 'Cleese'
    });
  });

  it('defines properties on the instance', function() {
    expect(john).to.have.property('firstName');
  });

  it('sets properties from the constructor', function() {
    expect(john).to.have.property('firstName', 'John');
  });

  it('can change properties using update', function() {
    john.update({ firstName: 'Graham' });
    expect(john).to.have.property('firstName', 'Graham');
  });

  it('does not allow updating non-existant properties', function() {
    expect(function() {
      john.update({ nonExistantProperty: 'Foo' });
    }).to.throw(Error, 'No such attribute: nonExistantProperty');
  });

  it('initialises with default values', function() {
    expect(john).to.have.property('age', 10);
  });

  it('can set an accessor property', function() {
    john.firstName = 'Graham';
    expect(john).to.have.property('firstName', 'Graham');
  });

  it('uses custom setter functions accessing properties', function() {
    john.age = '30';
    expect(john).to.have.property('age', 30);
  });

  it('uses custom setter functions using update', function() {
    john.update({ age: '30' });
    expect(john).to.have.property('age', 30);
  });

  it('can read computed properties', function() {
    expect(john).to.have.property('fullName', 'John Cleese');
  });

  it('includes properties in JSON rep by default', function() {
    var json = john.toJSON();
    expect(json).to.have.property('firstName', 'John');
    expect(json).to.have.property('lastName', 'Cleese');
    expect(json).to.have.property('age', 20);
  });

  it('excludes properties with serialize: false from JSON rep', function() {
    var json = john.toJSON();
    expect(json).to.not.have.property('fullName');
  });

  it('uses computed values in JSON rep when serialize is a function', function() {
    var json = john.toJSON();
    expect(json).to.have.property('age', 20);
  });
});
