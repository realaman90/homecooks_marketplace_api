const Wishlist = require('../models/Wishlist');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');

// Create a supplier or a customer
const ToggleAddToWishlist = async(req, res) => {
    const customer = req.user.userId;
    
    const {item} = req.params;
    // try removing, if updated count is zero, add it to the wish list

    const delResp = await Wishlist.deleteOne({
        $and:[
            {customer},
            {item}
        ]
    })

    if (delResp && delResp.deletedCount == 0){
        // add item to wishlist
        await Wishlist.create({
            customer,
            item,
            updatedAt:new Date()
        })
    }

    res.status(StatusCodes.OK).json({ message: "toggle item in wishlist" })
    return
};

const GetWishList = async (req, res) => {


};


module.exports = {
    ToggleAddToWishlist,
    GetWishList
}