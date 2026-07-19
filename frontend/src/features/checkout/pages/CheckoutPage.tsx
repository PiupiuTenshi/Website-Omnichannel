import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import { getAccountProfile } from "../../account/api/accountApi";
import { checkoutOrder } from "../api/onlineOrdersApi";
import "./CheckoutPage.css";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhoneNumber, setRecipientPhoneNumber] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (session === null) return;
    getAccountProfile(session.accessToken)
      .then((profile) => {
        setRecipientName(profile.displayName ?? "");
        setRecipientPhoneNumber(profile.phoneNumber ?? "");
        setDeliveryAddress(profile.defaultDeliveryAddress ?? "");
      })
      .catch(() => {
        // Checkout remains available when the profile request is temporarily unavailable.
      });
  }, [session]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const order = await checkoutOrder({
        recipientName,
        recipientPhoneNumber,
        deliveryAddress,
        paymentMethod: new FormData(event.currentTarget).get("paymentMethod") as "Cod" | "BankTransfer"
      }, session?.accessToken);
      navigate(`/orders/${order.onlineOrderId}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tạo đơn. Kiểm tra địa chỉ và tồn kho rồi thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="checkout-page app-container">
      <h1>Thanh toán</h1>
      <p>Phí giao hàng và tổng tiền được tính bởi hệ thống.</p>
      {session !== null && <p>Đã điền thông tin từ hồ sơ. Bạn có thể sửa cho đơn hàng này mà không làm thay đổi hồ sơ.</p>}
      <form onSubmit={(event) => void submit(event)}>
        <label>Người nhận<input name="name" required value={recipientName} onChange={(event) => setRecipientName(event.target.value)} /></label>
        <label>Số điện thoại<input name="phone" inputMode="tel" required value={recipientPhoneNumber} onChange={(event) => setRecipientPhoneNumber(event.target.value)} /></label>
        <label>Địa chỉ giao hàng<textarea name="address" required rows={4} value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} /></label>
        <fieldset>
          <legend>Thanh toán</legend>
          <label><input defaultChecked name="paymentMethod" type="radio" value="Cod" /> Thanh toán khi nhận hàng</label>
          <label><input name="paymentMethod" type="radio" value="BankTransfer" /> Chuyển khoản</label>
        </fieldset>
        {error ? <p role="alert">{error}</p> : null}
        <button disabled={isSubmitting} type="submit">{isSubmitting ? "Đang tạo đơn…" : "Đặt hàng"}</button>
      </form>
    </section>
  );
}
