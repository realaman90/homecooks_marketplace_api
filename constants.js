const eventStatus = { 
  PENDING: "pending",
  ACTIVE: "active",
  CANCELLED: "cancelled",
  FULFILLED: "fulfilled",
  DELIVERED: "delivered",
  CONFIRMED: "confirmed"
};

const orderStatus = {
  PENDING_CHECKOUT: "pending_checkout",
  ACTIVE: "active",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  DELIVERED: "delivered",  
};

const paymentStatus = {
  PENDING_CHECKOUT: "pending_checkout",
  ORDER_PLACED: "order_placed",
  PAYMENT_PROCESSED: "payment_processed",
  COMPLETED: "completed"
}

const notificationTypes = {
  WELCOME_FR_USER: "welcome_fr_user",
  ORDER_CREATED_FR_USER: "order_created_fr_user",
  ORDER_CANCELLED_FR_USER: "order_cancelled_fr_user",
  ORDER_CREATED_FR_ADMIN: "order_created_fr_admin",
  TWENTY_FOUR_HOUR_DELIVERY_REMINDER_FR_USER: "twenty_four_hour_delivery_reminder_fr_user",

  // admin notifications
  NEW_SUPPLIER_SIGNUP_FR_ADMIN: "new_supplier_signup_fr_admin",
  NEW_USER_SIGNUP_FR_ADMIN: `new_user_signup_fr_admin`,
  NEW_USER_SIGNUP_FR_ADMIN: `new_user_signup_fr_admin`,
  NEW_DISH_CREATED_FR_ADMIN: `new_dish_created_fr_admin`,
  NEW_EVENT_CREATED_FR_ADMIN: `new_event_created_fr_admin`,
  NEW_ORDER_CREATED_FR_ADMIN: `new_order_created_fr_admin`,
}

module.exports = {
    eventStatus,
    orderStatus,
    paymentStatus,
    notificationTypes
}
