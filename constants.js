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

module.exports = {
    eventStatus,
    orderStatus
}
