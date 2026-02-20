import React, { useState } from 'react';
import '../styles/ProductImageSlider.css';
import { ChevronLeft } from 'lucide-react'; // Assuming lucide-react is available for icons

const ProductImageSlider = ({ images }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!images || images.length === 0) {
        return <div className="no-images-placeholder">No images available</div>;
    }

    return (
        <div className="product-image-slider">
            {/* Main Image Display */}
            <div className="main-image-display">
                <img
                    src={images[currentImageIndex]}
                    alt={`Product view ${currentImageIndex + 1}`}
                    className="main-product-image"
                    loading="lazy"
                />

                {/* Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button className="slider-arrow prev" onClick={prevImage} aria-label="Previous image">
                            <ChevronLeft size={20} />
                        </button>
                        <button className="slider-arrow next" onClick={nextImage} aria-label="Next image">
                            <ChevronLeft size={20} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                    </>
                )}

                {/* Dot indicators (mobile) */}
                {images.length > 1 && (
                    <div className="slider-dots">
                        {images.map((_, i) => (
                            <span
                                key={i}
                                className={`slider-dot ${i === currentImageIndex ? 'active' : ''}`}
                                onClick={() => setCurrentImageIndex(i)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="thumbnail-strip">
                    {images.map((img, index) => (
                        <button
                            key={index}
                            className={`thumbnail-item ${index === currentImageIndex ? 'active' : ''}`}
                            onClick={() => setCurrentImageIndex(index)}
                            aria-label={`View image ${index + 1}`}
                        >
                            <img src={img} alt={`Thumbnail ${index + 1}`} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductImageSlider;
