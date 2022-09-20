const mongoose = require("mongoose");

const checkMongoIdsAreSame = (_id1, _id2) => {
    const id1 = mongoose.Types.ObjectId(_id1);
    const id2 = mongoose.Types.ObjectId(_id2);
    if (id1.equals(id2)) {
      return true;
    }
    return false;
}
  
const checkIfMongoIdInArray = (_idArr, _id) => {
    if (!_idArr) {
      return false;
    }
    if (_idArr.length < 1) {
      return false;
    }
    let exists = false;
    _idArr.forEach((id) => {
      if (checkMongoIdsAreSame(id, _id)) {
        exists = true;
      }
    });
  
    return exists;
}
  
const convertToUniqueMongoIdArray = (mongoIdArray) => {
    const uniqueArray = [];
  
    mongoIdArray.forEach((mid) => {
      if (checkIfMongoIdInArray(uniqueArray, mid)) {
        // do nothing
      } else {
        uniqueArray.push(mid);
      }
    });
  
    return uniqueArray;
}

module.exports = {
    checkMongoIdsAreSame,
    checkIfMongoIdInArray,
    convertToUniqueMongoIdArray   
}