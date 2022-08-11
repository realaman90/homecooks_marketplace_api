module.exports = {
    IDGen: (prefix, postfixString) => {
        return `${prefix}${Math.floor(1000 + Math.random() * 9000)}${postfixString.substr(0, 3).toUpperCase()}`;
    }
}