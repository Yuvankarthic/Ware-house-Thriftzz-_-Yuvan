
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, X, Loader2 } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom sleek center location pin component
const CenterPin = () => {
    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -100%)', // Tip of pin at center
            zIndex: 1000,
            pointerEvents: 'none', // Allow map drags under it
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
        }}>
            <MapPin size={40} fill="#000" color="#000" />
            <div style={{
                width: '4px',
                height: '4px',
                background: 'rgba(0,0,0,0.5)',
                borderRadius: '50%',
                marginTop: '-2px',
                filter: 'blur(1px)'
            }} />
        </div>
    );
};

// Component to handle map movements and report center
const MapController = ({ onMoveEnd, onMoveStart }) => {
    const map = useMapEvents({
        moveend: () => {
            onMoveEnd(map.getCenter());
        },
        movestart: () => {
            onMoveStart();
        }
    });
    return null;
};

// Button to jump to current location
const LocateMeControl = ({ onLocate }) => {
    const map = useMap();

    const handleLocate = () => {
        map.locate().on("locationfound", function (e) {
            map.flyTo(e.latlng, map.getZoom());
            onLocate(e.latlng);
        });
    };

    return (
        <button
            onClick={handleLocate}
            className="locate-me-btn"
            title="Locate Me"
        >
            <Navigation size={20} />
        </button>
    );
};

const LocationPicker = ({ onConfirm, onCancel, initialPosition }) => {
    // Default to Mumbai or provided
    const defaultCenter = initialPosition || { lat: 19.0760, lng: 72.8777 };

    const [center, setCenter] = useState(defaultCenter);
    const [address, setAddress] = useState('');
    const [loadingAddr, setLoadingAddr] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [rawAddressData, setRawAddressData] = useState(null);

    // Initial geolocation if no prop provided
    const [hasInitialLocated, setHasInitialLocated] = useState(!!initialPosition);

    useEffect(() => {
        if (!initialPosition && !hasInitialLocated && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCenter({ lat: latitude, lng: longitude });
                    setHasInitialLocated(true);
                },
                (err) => console.error(err)
            );
        }
    }, [initialPosition, hasInitialLocated]);

    // Reverse Geocode
    const fetchAddress = async (lat, lng) => {
        setLoadingAddr(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                setAddress(data.display_name);
                setRawAddressData(data);
            } else {
                setAddress("Location selected");
            }
        } catch (err) {
            setAddress("Location selected (Address unavailable)");
        } finally {
            setLoadingAddr(false);
        }
    };

    // When map stops moving, fetch address
    const handleMoveEnd = (newCenter) => {
        setIsDragging(false);
        setCenter(newCenter);
        fetchAddress(newCenter.lat, newCenter.lng);
    };

    const handleMoveStart = () => {
        setIsDragging(true);
    };

    // Fetch initial
    useEffect(() => {
        fetchAddress(center.lat, center.lng);
    }, []);

    return (
        <div className="location-picker-overlay">
            <div className="location-picker-modal">
                <div className="lp-map-wrapper">
                    <MapContainer
                        center={center}
                        zoom={15}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                    >
                        {/* Clean minimal monochrome tiles */}
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                        />
                        <CenterPin />
                        <MapController onMoveEnd={handleMoveEnd} onMoveStart={handleMoveStart} />
                        <LocateMeControl onLocate={(loc) => {
                            setCenter(loc);
                            fetchAddress(loc.lat, loc.lng);
                        }} />
                    </MapContainer>

                    {/* Top Bar for close */}
                    <div className="lp-top-bar">
                        <h3>Select Delivery Location</h3>
                        <button onClick={onCancel} className="lp-close-btn-round"><X size={20} /></button>
                    </div>
                </div>

                {/* Bottom Floating Card */}
                <div className="lp-bottom-card">
                    <div className="lp-address-header">
                        <div className={`lp-pin-indicator ${isDragging ? 'bounce' : ''}`}>
                            <MapPin size={18} />
                        </div>
                        <div className="lp-address-text">
                            <h4>{isDragging ? "Locating..." : "Confirm Location"}</h4>
                            <p>{isDragging ? "Relocate pin to adjust" : (loadingAddr ? "Fetching address..." : address)}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => onConfirm({
                            address: rawAddressData?.address?.road || rawAddressData?.display_name || address,
                            city: rawAddressData?.address?.city || rawAddressData?.address?.town || rawAddressData?.address?.center || "",
                            pincode: rawAddressData?.address?.postcode || "",
                            fullResponse: rawAddressData
                        })}
                        className="lp-confirm-btn"
                        disabled={loadingAddr || isDragging}
                    >
                        {loadingAddr ? <Loader2 className="animate-spin" size={20} /> : "Confirm Location"}
                    </button>
                </div>
            </div>

            <style>{`
                /* Animations */
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }

                .location-picker-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    z-index: 9999;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    animation: fadeIn 0.3s ease;
                }

                .location-picker-modal {
                    background: white;
                    width: 100%;
                    max-width: 500px;
                    height: 85vh;
                    max-height: 700px;
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
                    position: relative;
                }

                .lp-map-wrapper {
                    flex: 1;
                    position: relative;
                    height: 100%;
                }

                .lp-top-bar {
                    position: absolute;
                    top: 20px;
                    left: 20px;
                    right: 20px;
                    z-index: 1000;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    pointer-events: none;
                }

                .lp-top-bar h3 {
                    margin: 0;
                    background: rgba(255,255,255,0.9);
                    padding: 8px 16px;
                    border-radius: 30px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    pointer-events: auto;
                }

                .lp-close-btn-round {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: white;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    pointer-events: auto;
                    transition: transform 0.2s;
                }
                .lp-close-btn-round:hover { transform: scale(1.05); }

                .locate-me-btn {
                    position: absolute;
                    bottom: 220px; /* Just above the card */
                    right: 20px;
                    width: 44px;
                    height: 44px;
                    background: white;
                    border: none;
                    border-radius: 50%;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    z-index: 1000;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-main, #333);
                }

                .lp-bottom-card {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: white;
                    padding: 24px;
                    border-radius: 24px 24px 0 0;
                    z-index: 1000;
                    box-shadow: 0 -5px 20px rgba(0,0,0,0.05);
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .lp-address-header {
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                    margin-bottom: 20px;
                }

                .lp-pin-indicator {
                    width: 40px;
                    height: 40px;
                    background: #f4f4f5;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--text-main, #000);
                    flex-shrink: 0;
                }
                
                .lp-pin-indicator.bounce {
                    animation: bounce 1s infinite;
                    color: #666;
                }

                .lp-address-text {
                    flex: 1;
                    min-width: 0;
                }

                .lp-address-text h4 {
                    margin: 0 0 4px 0;
                    font-size: 1rem;
                    font-weight: 700;
                    font-family: var(--font-heading, sans-serif);
                }

                .lp-address-text p {
                    margin: 0;
                    font-size: 0.85rem;
                    color: #666;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    font-family: var(--font-body, sans-serif);
                }

                .lp-confirm-btn {
                    width: 100%;
                    background: #000;
                    color: white;
                    border: none;
                    padding: 16px;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--font-heading, sans-serif);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .lp-confirm-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                
                @media (max-width: 480px) {
                   .location-picker-modal {
                        height: 100%;
                        max-height: 100%;
                        border-radius: 0;
                   } 
                   .lp-bottom-card {
                        padding-bottom: 40px; /* Env safe area */
                   }
                }
            `}</style>
        </div>
    );
};

export default LocationPicker;
