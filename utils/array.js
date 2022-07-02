const mongoose = require('mongoose');

const checkMongoIdsAreSame = (_id1, _id2)  => {    
    if (_id1.equals(_id2)) {
      return true;
    }
    return false;
}

const pickWith_idFromObjectArray = (objArray, _id) => {    
    let res = null;
    objArray.forEach(o=>{        
      if (checkMongoIdsAreSame(o._id, _id)){
          console.log("idiya mili")
          res = o
      }
    })
    return res
}

const convertIdArrayToObjectID = (ids) => {
    const objectIdsArray = [];
    ids.forEach((id) => {
      objectIdsArray.push(mongoose.Types.ObjectId(id));
    });
    return objectIdsArray;
}
  
module.exports = {
    pickWith_idFromObjectArray,
    convertIdArrayToObjectID
}