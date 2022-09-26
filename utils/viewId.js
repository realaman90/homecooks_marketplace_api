module.exports = {
    IDGen: (prefix, postfixString) => {
        return `${prefix}${Math.floor(10000 + Math.random() * 90000)}${postfixString.substr(0, 3).toUpperCase()}`;
    }
}