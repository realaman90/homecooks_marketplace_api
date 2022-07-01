const productModel = require('../models/Product');
const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const { default: mongoose } = require('mongoose');

const createProduct = async (req, res) => {

    const productData = req.body;    
    let product = null;
    try {
        product = await productModel.create(productData);
    } catch(err){
        throw new CustomError.BadRequestError(err.message);
    }
    return res.status(StatusCodes.CREATED).json({ product });
}

const getAllProducts = async (req, res) => {

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    let andQuery = [];

    // manage filters    
    if (req.query.cuisine){
        andQuery.push({
            cuisine: { $regex: req.query.cuisine, $options: 'i' }
        })
    }
    if (req.query.category){
        andQuery.push({
            category: req.query.category
        })
    }
    if (req.query.searchStr){
        andQuery.push({
            "$or": [
                { name: { $regex: req.query.searchStr, $options: 'i' },},
                { description: { $regex: req.query.searchStr, $options: 'i' },},
                { viewId: { $regex: req.query.searchStr, $options: 'i' },},     
                { cuisine: { $regex: req.query.searchStr, $options: 'i' },},   
                { category: { $regex: req.query.searchStr, $options: 'i' },},                
            ]     
        })
    }

    const aggreagatePipelineQueries = [];
    if (andQuery.length > 0){
        aggreagatePipelineQueries.push({
            "$match": {
                "$and": andQuery
            }
        })
    }
    aggreagatePipelineQueries.push({"$sort": {"createdAt":-1}})
    aggreagatePipelineQueries.push({"$skip": skip})
    aggreagatePipelineQueries.push({"$limit": limit})
    aggreagatePipelineQueries.push({
        "$lookup": {
          "from": "suppliers",
          "localField": "supplier",
          "foreignField": "_id",
          "as": "supplier"
        }
    })
    aggreagatePipelineQueries.push({"$unwind": '$supplier'})
    aggreagatePipelineQueries.push({
        "$project":{
            "_id":1,
            "supplier.businessName":1,
            "supplier.businessImages":1,
            "supplier.address":1,
            "supplier.contactInfo":1,
            "name":1,
            "images":1,
            "category":1,
            "cuisine":1,
            "description":1,
          }
    })

    let products = await productModel.aggregate(aggreagatePipelineQueries)
    
    return res.status(StatusCodes.OK).json({ products });


}

const getAllProductsBySupplier = async (req, res) => {

    const supplierId = req.params.supplierId;

    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    
    let andQuery = [];

    andQuery.push({
        supplier: mongoose.Types.ObjectId(supplierId) 
    })

    // manage filters    
    if (req.query.cuisine){
        andQuery.push({
            cuisine: { $regex: req.query.cuisine, $options: 'i' }
        })
    }
    if (req.query.category){
        andQuery.push({
            category: req.query.category
        })
    }
    if (req.query.searchStr){
        andQuery.push({
            "$or": [
                { name: { $regex: req.query.searchStr, $options: 'i' },},
                { description: { $regex: req.query.searchStr, $options: 'i' },},
                { viewId: { $regex: req.query.searchStr, $options: 'i' },},     
                { cuisine: { $regex: req.query.searchStr, $options: 'i' },},   
                { category: { $regex: req.query.searchStr, $options: 'i' },},                
            ]     
        })
    }

    const aggreagatePipelineQueries = [];
    if (andQuery.length > 0){
        aggreagatePipelineQueries.push({
            "$match": {
                "$and": andQuery
            }
        })
    }
    aggreagatePipelineQueries.push({"$sort": {"createdAt":-1}})
    aggreagatePipelineQueries.push({"$skip": skip})
    aggreagatePipelineQueries.push({"$limit": limit})
    aggreagatePipelineQueries.push({
        "$lookup": {
          "from": "suppliers",
          "localField": "supplier",
          "foreignField": "_id",
          "as": "supplier"
        }
    })
    aggreagatePipelineQueries.push({"$unwind": '$supplier'})
    aggreagatePipelineQueries.push({
        "$project":{
            "_id":1,
            "supplier.businessName":1,
            "supplier.businessImages":1,
            "supplier.address":1,
            "supplier.contactInfo":1,
            "name":1,
            "images":1,
            "category":1,
            "cuisine":1,
            "description":1,
          }
    })

    let products = await productModel.aggregate(aggreagatePipelineQueries)
    
    return res.status(StatusCodes.OK).json({ products });

}

const getProduct = async (req, res) => {

    const productId = req.params.productId;

    let products = await productModel.aggregate([
        {
            "$match": {
                "_id": mongoose.Types.ObjectId(productId)
            } 
        },{        
          "$lookup": {
            "from": "suppliers",
            "localField": "supplier",
            "foreignField": "_id",
            "as": "supplier"
          }
        },{      
          "$unwind": '$supplier'      
        },{
          "$project":{
            "_id":1,
            "supplier.businessName":1,
            "supplier.businessImages":1,
            "supplier.address":1,
            "supplier.contactInfo":1,
            "name":1,
            "images":1,
            "category":1,
            "cuisine":1,
            "description":1,
          }
        }])
    
    if (products.length < 1){
        throw new CustomError.BadRequestError('Invalid Product Id');
    }

    return res.status(StatusCodes.OK).json({ product: products[0] });

}

const editProduct = async (req, res) => {

    const productId = req.params.productId;
    const updateProductData = req.body;

    let updateResp = null;

    try {
        updateResp = await productModel.updateOne({
            _id: productId
        }, {
            $set: updateProductData
        });
    } catch(err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!updateResp.modifiedCount){
        throw new CustomError.BadRequestError('Failed to update data');
    }

    return res.status(StatusCodes.OK).json({ msg: `Product data updated!` });
}

const deleteProduct = async (req, res) => {

    const productId = req.params.productId;

    let deleteResp = null;

    try {
        deleteResp = await productModel.deleteOne({
            $and : [
                {_id: productId}                
            ]
        });
    } catch(err) {
        throw new CustomError.BadRequestError(err.message);
    }

    if (!deleteResp.deletedCount){
        throw new CustomError.BadRequestError('Failed remove the product');
    }

    return res.status(StatusCodes.OK).json({ msg: `Product removed!` });

}

module.exports = {
    createProduct,
    getAllProducts,
    getAllProductsBySupplier,
    getProduct,
    editProduct,
    deleteProduct,
}
