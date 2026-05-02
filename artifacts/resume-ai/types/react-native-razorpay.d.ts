declare module "react-native-razorpay" {
  const RazorpayCheckout: {
    open(options: {
      key: string;
      amount: number;
      currency?: string;
      order_id?: string;
      name?: string;
      description?: string;
      theme?: { color?: string };
    }): Promise<{
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }>;
  };

  export default RazorpayCheckout;
}
