const { multiply, sum, round } = require("mathjs");

const SERVICE_FEE_MULTIPLIER = 1.15;
const TAX_RATE_MULTIPLIER = 1.0975;
const DELIVERY_FEE = 5;

// Caterer Price	11
// Caterer markup/plate	2
// Item total	13
// Servcice fees	1.95
// Tax	$1.94
// Subtotal	$16.89
// Delivery fees	$4.99

// cost, - item total
// serviceFee, - 
// tax,
// subTotal,
// deliveryFee,
// total,

// costToSupplier: totalCostToSupplier,

const priceBreakdownItem = (price) => {
    const pricePostSF = multiply(price, SERVICE_FEE_MULTIPLIER);    
    const fPrice = round(multiply(pricePostSF, TAX_RATE_MULTIPLIER),2)
    return {
        cost: price,
        serviceFee: round((pricePostSF - price), 2),
        tax: round((fPrice - pricePostSF),2),
        subTotal: fPrice
    }
}

// console.log(priceBreakdownItem(1000));

const priceBreakdownCheckout = (items, deliveryPoints) => {
    let totalCost = 0;
    let totalCostToSupplier = 0;
    items.forEach((i) => {
        totalCost = totalCost + i.quantity * i.item.pricePerOrder;
        totalCostToSupplier =
            totalCostToSupplier + i.quantity * i.item.costToSupplierPerOrder;
    });

    const resp = priceBreakdownItem(totalCost);
    
    resp.deliveryFee = round(multiply(DELIVERY_FEE ,deliveryPoints),2)
    resp.total = round(sum(resp.subTotal ,resp.deliveryFee),2)
    resp.costToSupplier = totalCostToSupplier;
    return resp;
}

const priceBreakdownItemV2 = (price) => {
    const pricePostSF = multiply(price, SERVICE_FEE_MULTIPLIER);    
    const fPrice = round(multiply(pricePostSF, TAX_RATE_MULTIPLIER),2)
    return {
        cost: price,
        serviceFee: round((pricePostSF - price), 2),
        tax: round((fPrice - pricePostSF),2),
        subTotal: fPrice
    }
}

const paymentCalcualtion = (orders) => {

    let totalItemPrice = 0;    
    let deliveryFee = 0;
    let total = 0;
    let costToSupplier = 0;

    orders.forEach((o) => {
        totalItemPrice = totalItemPrice + multiply(o.quantity, o.itemPrice)        
        costToSupplier = costToSupplier+ o.costToSupplier;
        deliveryFee = deliveryFee+ o.deliveryFee;
    });

    totalItemPrice = round(totalItemPrice,2)
    const {subTotal, serviceFee, tax} = priceBreakdownItem(totalItemPrice)

    total = round(sum(subTotal, deliveryFee),2);

    return {
        totalItemPrice,
        serviceFee,
        tax,
        subTotal,        
        deliveryFee,        
        total,
        costToSupplier
    }
}

module.exports = {
    priceBreakdownCheckout,
    priceBreakdownItem,
    paymentCalcualtion,
    DELIVERY_FEE
}

