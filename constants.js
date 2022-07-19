const eventStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  CANCELLED: "cancelled",
  FULFILLED: "fulfilled",
  DELIVERED: "delivered",
};

const orderStatus = {
  PENDING: "pending",  
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  DELIVERED: "delivered",  
};

const paymentStatus = {
  PENDING_CHECKOUT: "pending_checkout",
  ORDER_PLACED: "order_placed"
}


module.exports = {
    eventStatus,
    orderStatus,
    paymentStatus
}
