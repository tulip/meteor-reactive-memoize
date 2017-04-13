import _ from 'lodash';

import { EJSON } from 'meteor/ejson';
import { Tracker } from 'meteor/tracker';

export default class ReactiveMap {
  constructor(initialValues, opts) {
    this._values = new Map();
    this._deps = new Map();

    if (opts && opts.useEJSONComparison) {
      this._comparisonFunction = (a, b) => EJSON.equals(a, b);
    } else {
      this._comparisonFunction = (a, b) => a === b;
    }

    this._allDep = new Tracker.Dependency();

    // if an inital set of values was passed, setAll them
    if (initialValues) {
      this.setAll(initialValues);
    }

    // bind all method instances of the prototype to the object itself Would
    // call Utils.bindAll(), but it causes a circular dependency.
    this.getDep = this.getDep.bind(this);
    this.set = this.set.bind(this);
    this.get = this.get.bind(this);
    this.getMultiple = this.getMultiple.bind(this);
    this.getAll = this.getAll.bind(this);
    this.keys = this.keys.bind(this);
    this.hasKey = this.hasKey.bind(this);
    this.setAll = this.setAll.bind(this);
    this.depend = this.depend.bind(this);
    this.changed = this.changed.bind(this);
    this.remove = this.remove.bind(this);
    this.removeAll = this.removeAll.bind(this);
    this.empty = this.empty.bind(this);
    this.replace = this.replace.bind(this);
    this.toJSONValue = this.toJSONValue.bind(this);
    this.typeName = this.typeName.bind(this);
    this.getMultipleMap = this.getMultipleMap.bind(this);
    this.getAllMap = this.getAllMap.bind(this);
    this.values = this.values.bind(this);
    this.entries = this.entries.bind(this);
    this.forEach = this.forEach.bind(this);
    this.has = this.has.bind(this);
    this.delete = this.delete.bind(this);
    this.clear = this.clear.bind(this);
  }

  getDep(key) {
    if (!this._deps.has(key)) {
      this._deps.set(key, new Tracker.Dependency());
    }

    return this._deps.get(key);
  }

  set(key, newVal) {
    const val = this._values.get(key);

    if (!this._comparisonFunction(newVal, val)) {
      this._values.set(key, newVal);
      this.getDep(key).changed();
      this._allDep.changed();
    }
  }

  get(key) {
    this.getDep(key).depend();
    return this._values.get(key);
  }

  getMultiple(keys) {
    const vals = {};

    keys.forEach(key => {
      vals[key] = this.get(key);
    });

    return vals;
  }

  // returns a map of {key -> value}
  getAll() {
    this._allDep.depend();

    const all = {};
    _.each(Array.from(this._values.entries()), entry => {
      all[entry[0]] = entry[1];
    });

    return all;
  }

  // returns an array of keys
  keys() {
    this._allDep.depend();
    return Array.from(this._values.keys());
  }

  hasKey(key) {
    this.getDep(key).depend();
    return this._values.has(key);
  }

  // adds each item in the map to this map
  setAll(obj) {
    _.each(obj, (val, key) => {
      this.set(key, val);
    });
  }

  // establish a dependency on either this map or a particular key of this
  // map.
  depend(key) {
    if (key) {
      this.getDep(key).depend();
    } else {
      this._allDep.depend();
    }
  }

  changed(key) {
    if (key) {
      this.getDep(key).changed();
    } else {
      this._allDep.changed();
    }
  }

  // deletes an item from the map
  remove(key) {
    if (this.has(key)) {
      this.getDep(key).changed();
      this._values.delete(key);
      this._allDep.changed();
    }
  }

  removeAll() {
    _.each(this.keys(), key => {
      this.remove(key);
    });
  }

  get size() {
    this._allDep.depend();
    return this._values.size;
  }

  empty() {
    this._allDep.depend();
    return this._values.size === 0;
  }

  replace(newValues) {
    this.removeAll();
    this.setAll(newValues);
  }

  toJSONValue() {
    return EJSON.toJSONValue(this.getAll());
  }

  typeName() {
    return 'TulipReactiveMap';
  }


  /*
   * Methods that return Map objects instead of object literals as versions
   * above do.
   */

  getMultipleMap(keys) {
    const vals = new Map();

    _.forEach(keys, key => vals.set(key, this.get(key)));

    return vals;
  }

  getAllMap() {
    this._allDep.depend();
    return new Map(this._values);
  }


  /*
   * Methods to Give similar signature to Native Map...
   */

  // returns an array of values
  values() {
    this._allDep.depend();
    return Array.from(this._values.values());
  }

  entries() {
    this._allDep.depend();
    return this._values.entries();
  }

  // returns an array of values
  forEach(...args) {
    this._allDep.depend();
    return Map.prototype.forEach.apply(this._values, args);
  }

  has(key) {
    return this.hasKey(key);
  }

  delete(key) {
    return this.remove(key);
  }

  clear() {
    return this.removeAll();
  }
}

EJSON.addType('tulip-reactivemap', ReactiveMap);
