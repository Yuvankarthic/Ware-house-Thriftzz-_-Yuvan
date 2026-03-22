import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { X, Minus, Plus, Trash2, ArrowLeft, MapPin, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BASE_URL from '../config/api';
import '../styles/CartDrawer.css';
import OrderSuccess from './OrderSuccess';
import LocationPicker from './LocationPicker';

// Steps: 'cart' → 'details' → 'review'
const CartDrawer = () => {
    const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();

    const [step, setStep] = useState('cart'); // 'cart' | 'details' | 'review'
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', address: '', city: '', pincode: ''
    });
    const [errors, setErrors] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

    const isFormValid = React.useMemo(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return (
            formData.name.trim() !== '' &&
            emailRegex.test(formData.email) &&
            formData.phone.trim().length >= 10 &&
            /^\d+$/.test(formData.phone) &&
            formData.address.trim() !== '' &&
            formData.city.trim() !== '' &&
            formData.pincode.trim().length === 6 &&
            /^\d+$/.test(formData.pincode)
        );
    }, [formData]);

    const closeDrawer = () => {
        setIsCartOpen(false);
        setTimeout(() => { setStep('cart'); setErrors({}); setIsProcessing(false); }, 300);
    };

    const handleSuccessClose = () => {
        setIsCartOpen(false);
        setIsPaymentSuccess(false);
        window.location.href = '/';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) newErrors.email = 'Required';
        else if (!emailRegex.test(formData.email)) newErrors.email = 'Enter a valid email';
        if (!formData.phone.trim()) newErrors.phone = 'Required';
        else if (!/^\d+$/.test(formData.phone)) newErrors.phone = 'Numbers only';
        else if (formData.phone.length < 10) newErrors.phone = 'Enter 10-digit number';
        if (!formData.address.trim()) newErrors.address = 'Required';
        if (!formData.city.trim()) newErrors.city = 'Required';
        if (!formData.pincode.trim()) newErrors.pincode = 'Required';
        else if (!/^\d+$/.test(formData.pincode)) newErrors.pincode = 'Numbers only';
        else if (formData.pincode.length !== 6) newErrors.pincode = '6 digits required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleProceedToReview = () => {
        if (validateForm()) setStep('review');
    };

    const saveOrderToGoogleSheet = async (paymentId) => {
        const orderId = `WHT-${Date.now()}`;
        const productsSummary = cartItems.map(item => `${item.name} (${item.size}) x${item.quantity}`).join(', ');
        const payload = {
            orderId, name: formData.name, email: formData.email, phone: formData.phone,
            address: formData.address, city: formData.city, pincode: formData.pincode,
            products: productsSummary, amount: cartTotal, paymentId, status: 'PAID'
        };
        try {
            await fetch('https://script.google.com/macros/s/AKfycbzc0i5Nu2vpb2FdC6AIGWuFvb42rAc2RiGXBLPWYEl8YXJ4D8GAWMvQd8Hoz0LVbncv/exec', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(payload)
            });
            return true;
        } catch (error) {
            console.error('Error saving order:', error);
            return false;
        }
    };

    // Send order to backend → PostgreSQL
    const createBackendOrder = async (paymentId) => {
        try {
            console.log(`📤 Sending ${cartItems.length} order(s) to backend: ${BASE_URL}/api/orders`);
            
            for (const item of cartItems) {
                const matchedApiId = String(item.id).match(/^api-(\d+)$/);
                const numericProductId = matchedApiId ? Number.parseInt(matchedApiId[1], 10) : Number.parseInt(String(item.id), 10);

                const orderPayload = {
                    customer_name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    pincode: formData.pincode,
                    product_id: Number.isInteger(numericProductId) ? numericProductId : null,
                    product_name: item.name,
                    order_value: Number(item.price) || 0,
                    quantity: item.quantity || 1,
                    payment_id: paymentId,
                };
                
                console.log('📦 Order payload:', orderPayload);
                
                const response = await fetch(`${BASE_URL}/api/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderPayload),
                });
                
                const result = await response.json();
                
                if (!response.ok) {
                    console.warn(`⚠️ Backend response status: ${response.status}`, result);
                } else {
                    console.log(`✅ Order created successfully:`, result);
                }
            }
            console.log('✅ All backend orders synced');
        } catch (error) {
            // Never break checkout — backend errors are non-blocking
            console.error('❌ Backend order creation failed (non-blocking):', error);
            console.error('💡 Your order was processed by Razorpay but may not be in dashboard yet.');
            console.error('🔄 Dashboard will auto-sync in 2-3 seconds. If not, refresh the page.');
        }
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        const options = {
            key: 'rzp_live_SIWbEpIpIPvf5L',
            amount: cartTotal * 100,
            currency: 'INR',
            name: 'WHT',
            description: 'Streetwear Order',
            image: '/vite.svg',
            notes: {
                customer_name: formData.name,
                customer_email: formData.email,
                customer_phone: formData.phone,
                items: JSON.stringify(cartItems.map(item => ({ name: item.name, price: item.price, quantity: item.quantity, size: item.size })))
            },
            handler: async function (response) {
                console.log('🎉 Payment successful! Payment ID:', response.razorpay_payment_id);
                setIsProcessing(true);
                
                try {
                    // Google Sheets (existing) + Backend (new) — both fire in parallel
                    await Promise.all([
                        saveOrderToGoogleSheet(response.razorpay_payment_id),
                        createBackendOrder(response.razorpay_payment_id),
                    ]);
                    
                    // Wait a moment for backend to fully process
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    console.log('✨ Order sync complete! Clearing cart...');
                    clearCart();
                    setIsPaymentSuccess(true);
                } catch (error) {
                    console.error('Error during order sync:', error);
                    setIsPaymentSuccess(true); // Still show success - order is paid
                } finally {
                    setIsProcessing(false);
                }
            },
            modal: { ondismiss: () => setIsProcessing(false) },
            prefill: { name: formData.name, email: formData.email, contact: formData.phone },
            theme: { color: '#121212' }
        };
        try {
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', () => { setIsProcessing(false); alert('Payment failed. Please try again.'); });
            rzp.open();
        } catch (err) {
            console.error('Razorpay error', err);
            setIsProcessing(false);
            alert('Could not load payment gateway. Check your internet.');
        }
    };

    const stepTitles = { cart: 'My Bag', details: 'Delivery Details', review: 'Review Order' };

    return (
        <AnimatePresence>
            {showLocationPicker && (
                <LocationPicker
                    onConfirm={(locationData) => {
                        setFormData(prev => ({
                            ...prev,
                            address: locationData.address || prev.address,
                            city: locationData.city || prev.city,
                            pincode: locationData.pincode || prev.pincode
                        }));
                        setShowLocationPicker(false);
                    }}
                    onCancel={() => setShowLocationPicker(false)}
                />
            )}

            {isPaymentSuccess && <OrderSuccess onClose={handleSuccessClose} />}

            {isCartOpen && !isPaymentSuccess && (
                <>
                    <motion.div
                        className="cart-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={closeDrawer}
                    />
                    <motion.div
                        className="cart-drawer"
                        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                    >
                        {/* ── Header ── */}
                        <div className="cart-header">
                            <div className="cart-header-left">
                                {step !== 'cart' && (
                                    <button className="back-btn" onClick={() => setStep(step === 'review' ? 'details' : 'cart')}>
                                        <ArrowLeft size={18} />
                                    </button>
                                )}
                                <h3>{stepTitles[step]}</h3>
                            </div>
                            <button className="close-btn" onClick={closeDrawer}><X size={22} /></button>
                        </div>

                        {/* ── Step indicator ── */}
                        <div className="step-indicator">
                            {['cart', 'details', 'review'].map((s, i) => (
                                <React.Fragment key={s}>
                                    <div className={`step-dot ${step === s ? 'active' : (
                                        (step === 'details' && i === 0) || (step === 'review' && i < 2) ? 'done' : ''
                                    )}`} />
                                    {i < 2 && <div className={`step-line ${(step === 'details' && i === 0) || (step === 'review') ? 'done' : ''}`} />}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* ════════════════════
                            STEP 1 — CART
                        ════════════════════ */}
                        {step === 'cart' && (
                            <>
                                <div className="cart-items">
                                    {cartItems.length === 0 ? (
                                        <div className="empty-cart">
                                            <ShoppingBag size={40} strokeWidth={1} className="empty-bag-icon" />
                                            <p>Your bag is empty.</p>
                                            <button className="btn-shop" onClick={closeDrawer}>Continue Shopping</button>
                                        </div>
                                    ) : (
                                        cartItems.map(item => (
                                            <div key={item.id} className="cart-item">
                                                <div className="cart-item-image">
                                                    {item.image
                                                        ? <img src={item.image} alt={item.name} />
                                                        : <span className="cart-placeholder">{item.name[0]}</span>
                                                    }
                                                </div>
                                                <div className="cart-item-details">
                                                    <h4>{item.name}</h4>
                                                    <p className="cart-item-meta">{item.size} · {item.condition}</p>
                                                    <div className="cart-item-price">₹{item.price}</div>
                                                    <div className="cart-controls">
                                                        <div className="qty-controls" style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#666', background: '#f5f5f5', borderRadius: '4px' }}>
                                                            <span>1 of 1</span>
                                                        </div>
                                                        <button className="remove-btn" onClick={() => removeFromCart(item.id)}><Trash2 size={15} /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                {cartItems.length > 0 && (
                                    <div className="cart-footer">
                                        <div className="cart-total">
                                            <span>Subtotal</span>
                                            <span>₹{cartTotal}</span>
                                        </div>
                                        <p className="shipping-note">Shipping calculated at checkout</p>
                                        <button className="btn-primary checkout-btn" onClick={() => setStep('details')}>
                                            Continue to Checkout →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ════════════════════
                            STEP 2 — DETAILS FORM
                        ════════════════════ */}
                        {step === 'details' && (
                            <>
                                <div className="checkout-form">
                                    <div className="form-section-label">Contact</div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Full Name <span className="required-asterisk">*</span></label>
                                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="John Doe" className={errors.name ? 'error' : ''} />
                                            {errors.name && <span className="form-error">{errors.name}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label>Phone <span className="required-asterisk">*</span></label>
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="9876543210" maxLength={10} className={errors.phone ? 'error' : ''} />
                                            {errors.phone && <span className="form-error">{errors.phone}</span>}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address <span className="required-asterisk">*</span></label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" className={errors.email ? 'error' : ''} />
                                        {errors.email && <span className="form-error">{errors.email}</span>}
                                    </div>

                                    <div className="form-section-label" style={{ marginTop: '20px' }}>Delivery Address</div>
                                    <div className="form-group">
                                        <div className="label-row">
                                            <label>Address <span className="required-asterisk">*</span></label>
                                            <button type="button" onClick={() => setShowLocationPicker(true)} className="locate-btn">
                                                <MapPin size={12} /> Use map
                                            </button>
                                        </div>
                                        <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="House No, Street, Landmark" className={errors.address ? 'error' : ''} />
                                        {errors.address && <span className="form-error">{errors.address}</span>}
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>City <span className="required-asterisk">*</span></label>
                                            <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Bengaluru" className={errors.city ? 'error' : ''} />
                                            {errors.city && <span className="form-error">{errors.city}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label>Pincode <span className="required-asterisk">*</span></label>
                                            <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} placeholder="560001" maxLength={6} className={errors.pincode ? 'error' : ''} />
                                            {errors.pincode && <span className="form-error">{errors.pincode}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="cart-footer">
                                    <button className="btn-primary checkout-btn" onClick={handleProceedToReview} disabled={!isFormValid}>
                                        Review Order →
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ════════════════════
                            STEP 3 — REVIEW
                        ════════════════════ */}
                        {step === 'review' && (
                            <>
                                <div className="review-content">
                                    {/* Order summary */}
                                    <div className="review-section">
                                        <p className="review-label">Order Summary</p>
                                        {cartItems.map(item => (
                                            <div key={item.id} className="review-item">
                                                <div className="review-item-img">
                                                    {item.image ? <img src={item.image} alt={item.name} /> : <span>{item.name[0]}</span>}
                                                </div>
                                                <div className="review-item-info">
                                                    <p className="review-item-name">{item.name}</p>
                                                    <p className="review-item-meta">{item.size} · 1 of 1 vintage</p>
                                                </div>
                                                <p className="review-item-price">₹{item.price}</p>
                                            </div>
                                        ))}
                                        <div className="review-total-row">
                                            <span>Total</span>
                                            <span className="review-total-amount">₹{cartTotal}</span>
                                        </div>
                                    </div>

                                    {/* Delivery details */}
                                    <div className="review-section">
                                        <p className="review-label">Delivering to</p>
                                        <div className="review-address-card">
                                            <p className="review-name">{formData.name}</p>
                                            <p className="review-addr">{formData.address}</p>
                                            <p className="review-addr">{formData.city} – {formData.pincode}</p>
                                            <p className="review-addr">{formData.phone} · {formData.email}</p>
                                            <button className="edit-details-btn" onClick={() => setStep('details')}>Edit details</button>
                                        </div>
                                    </div>

                                    <div className="review-confirm-row">
                                        <CheckCircle2 size={14} strokeWidth={1.5} />
                                        <span>By proceeding, you confirm all details above are correct.</span>
                                    </div>
                                </div>
                                <div className="cart-footer">
                                    <div className="cart-total">
                                        <span>Amount to Pay</span>
                                        <span>₹{cartTotal}</span>
                                    </div>
                                    <button className="btn-primary checkout-btn pay-btn" onClick={handlePayment} disabled={isProcessing}>
                                        {isProcessing ? 'Launching Payment…' : `Pay ₹${cartTotal} via Razorpay`}
                                    </button>
                                    <p className="trust-note">🔒 Secured by Razorpay</p>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartDrawer;
