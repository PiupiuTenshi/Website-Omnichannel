export {
  acceptQuote,
  cancelOrder,
  getOnlineOrder,
  setShippingQuote,
  confirmCodPayment,
  markPreparing,
  markDelivering,
  markDelivered,
  markDeliveryFailed,
  markReturned
} from "../../checkout/api/onlineOrdersApi";
export type { OnlineOrder } from "../../checkout/api/onlineOrdersApi";
