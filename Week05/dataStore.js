class DataStore {
    data = {};
    getData() {
        return this.data;
    }
    addEntry(key, value) {
        this.data[key] = value;
        return this.data;
    }
    removeEntry(key) {
        delete this.data[key];
        return this.data;
    }
    updateEntry(key, value) {
        if (this.data[key] === undefined) {
            throw new Error(`Key: ${key} not found`);
        }
        return this.addEntry(key, value);
    }
    checkIfExists(key) {
        return this.data[key] !== undefined;
    }
}

module.exports = new DataStore();