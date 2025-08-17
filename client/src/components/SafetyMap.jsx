import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";

// Map container styles
const containerStyle = {
  width: "100%",
  height: "450px",
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.2090,
};

// Static emergency contact (always available)
const EMERGENCY_CONTACT = {
  name: "Emergency Services",
  phone: "+919142946180", // Replace with actual emergency number
  whatsapp: "+919142946180", // Same number for WhatsApp
  isStatic: true
};

const SafetyMap = () => {
  const [location, setLocation] = useState(null);
  const [safetyPercentage, setSafetyPercentage] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [error, setError] = useState(null);
  
  // Separate contacts for email and phone
  const [emailContacts, setEmailContacts] = useState([]);
  const [phoneContacts, setPhoneContacts] = useState([]);
  const [newEmailContact, setNewEmailContact] = useState("");
  const [newPhoneContact, setNewPhoneContact] = useState("");
  const [newContactName, setNewContactName] = useState("");
  
  const [shareInterval, setShareInterval] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [shareHistory, setShareHistory] = useState([]);
  const [shareMethod, setShareMethod] = useState("both"); // "email", "sms", "whatsapp", "both"
  const [autoShareIntervalId, setAutoShareIntervalId] = useState(null);

  // Update location and safety data
  const updateLocation = (newLocation) => {
    setLocation(newLocation);
    const dummySafetyPercentage = Math.floor(Math.random() * 100) + 1;
    setSafetyPercentage(dummySafetyPercentage);
    
    // Auto-share if enabled and tracking
    if (isSharing && isTracking) {
      shareLocation(false);
    }
  };

  // Start tracking live location
  const startTracking = () => {
    if (navigator.geolocation) {
      setIsTracking(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          updateLocation(currentLocation);
        },
        (err) => {
          setError(err.message);
          setIsTracking(false);
        }
      );

      const id = navigator.geolocation.watchPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          updateLocation(currentLocation);
        },
        (err) => {
          setError(err.message);
          setIsTracking(false);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      setWatchId(id);
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  // Stop tracking
  const stopTracking = () => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    if (isSharing) stopSharing();
  };

  // Handle map click
  const onMapClick = useCallback((event) => {
    const clickedLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    updateLocation(clickedLocation);
  }, []);

  // Add new email contact
  const addEmailContact = () => {
    if (newEmailContact.trim() && !emailContacts.some(c => c.email === newEmailContact.trim())) {
      const newContacts = [...emailContacts, {
        id: Date.now(),
        name: newContactName.trim() || newEmailContact.trim(),
        email: newEmailContact.trim()
      }];
      setEmailContacts(newContacts);
      setNewEmailContact("");
      setNewContactName("");
    }
  };

  // Add new phone contact
  const addPhoneContact = () => {
    if (newPhoneContact.trim() && !phoneContacts.some(c => c.phone === newPhoneContact.trim())) {
      const newContacts = [...phoneContacts, {
        id: Date.now(),
        name: newContactName.trim() || newPhoneContact.trim(),
        phone: newPhoneContact.trim()
      }];
      setPhoneContacts(newContacts);
      setNewPhoneContact("");
      setNewContactName("");
    }
  };

  // Remove email contact
  const removeEmailContact = (id) => {
    setEmailContacts(emailContacts.filter(contact => contact.id !== id));
  };

  // Remove phone contact
  const removePhoneContact = (id) => {
    setPhoneContacts(phoneContacts.filter(contact => contact.id !== id));
  };

  // Validate phone number format
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Quick Emergency Function - Auto send location to emergency contact
  const quickEmergency = () => {
    if (!location) {
      alert("Please enable location tracking first!");
      return;
    }

    const locationUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    const timestamp = new Date().toLocaleString();
    
    const message = `🚨 QUICK EMERGENCY ALERT 🚨\n\nI need immediate help!\n\nMy current location: ${locationUrl}\n\nTime: ${timestamp}\n\nPlease contact me immediately or call emergency services if you cannot reach me.`;

    // Send via WhatsApp
    const whatsappUrl = `https://wa.me/${EMERGENCY_CONTACT.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Also send SMS
    const smsLink = `sms:${EMERGENCY_CONTACT.phone}?body=${encodeURIComponent(message)}`;
    window.open(smsLink, '_blank');

    // Record in history
    setShareHistory([...shareHistory, {
      timestamp: new Date().toISOString(),
      emailContacts: [],
      phoneContacts: [EMERGENCY_CONTACT],
      whatsappUsed: true,
      location,
      emergency: true,
      shareMethod: 'quick_emergency'
    }]);

    alert("🚨 EMERGENCY ALERT SENT!\nBoth WhatsApp and SMS have been triggered!");
  };

  // Share location to emergency contact via WhatsApp
  const shareToEmergencyWhatsApp = (emergency = false) => {
    if (!location) return;

    const locationUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    const timestamp = new Date().toLocaleString();
    
    const message = emergency
      ? `🚨 EMERGENCY ALERT 🚨\n\nI need immediate help!\n\nMy current location: ${locationUrl}\n\nTime: ${timestamp}\n\nPlease contact me immediately or call emergency services if you cannot reach me.`
      : `📍 Location Update\n\nMy current location: ${locationUrl}\n\nTime: ${timestamp}\n\nStay safe! 💙`;

    // WhatsApp URL with message
    const whatsappUrl = `https://wa.me/${EMERGENCY_CONTACT.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    const successMessage = emergency ? "🚨 Emergency alert sent to WhatsApp!" : "📍 Location shared via WhatsApp!";
    alert(successMessage);
  };

  // Share location to emergency contact via SMS
  const shareToEmergencySMS = (emergency = false) => {
    if (!location) return;

    const locationUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
    const timestamp = new Date().toLocaleString();
    
    const message = emergency
      ? `🚨 EMERGENCY ALERT 🚨\n\nI need immediate help!\n\nMy current location: ${locationUrl}\n\nTime: ${timestamp}\n\nPlease contact me immediately or call emergency services if you cannot reach me.`
      : `📍 Location Update\n\nMy current location: ${locationUrl}\n\nTime: ${timestamp}\n\nStay safe! 💙`;

    const smsLink = `sms:${EMERGENCY_CONTACT.phone}?body=${encodeURIComponent(message)}`;
    
    // Open default SMS app
    window.open(smsLink, '_blank');
    
    const successMessage = emergency ? "🚨 Emergency alert sent via SMS!" : "📍 Location shared via SMS!";
    alert(successMessage);
  };

  // Share location via Email/SMS/WhatsApp (client-side only)
  const shareLocation = async (emergency = false) => {
    if (!location) return;

    const hasEmailContacts = emailContacts.length > 0 && (shareMethod === "email" || shareMethod === "both");
    const hasPhoneContacts = phoneContacts.length > 0 && (shareMethod === "sms" || shareMethod === "both");
    const useWhatsApp = shareMethod === "whatsapp" || shareMethod === "both";

    try {
      const locationUrl = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
      const timestamp = new Date().toLocaleString();
      
      const message = emergency
        ? `🚨 EMERGENCY ALERT 🚨\n\nI need immediate help!\n\nMy current location: ${locationUrl}\n\nTime: ${timestamp}\n\nPlease contact me immediately or call emergency services if you cannot reach me.`
        : `📍 Location Update\n\nMy current location: ${locationUrl}\n\nTime: ${timestamp}\n\nStay safe! 💙`;

      // Handle email sharing
      if (hasEmailContacts) {
        const emailRecipients = emailContacts.map(c => c.email).join(',');
        const emailSubject = emergency ? '🚨 EMERGENCY ALERT' : '📍 Location Update';
        const mailtoLink = `mailto:${emailRecipients}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(message)}`;
        
        // Open default email client
        window.open(mailtoLink, '_blank');
      }

      // Handle SMS sharing
      if (hasPhoneContacts) {
        const smsRecipients = phoneContacts.map(c => c.phone).join(',');
        const smsLink = `sms:${smsRecipients}?body=${encodeURIComponent(message)}`;
        
        // Open default SMS app
        window.open(smsLink, '_blank');
      }

      // Handle WhatsApp sharing (always available via emergency contact)
      if (useWhatsApp) {
        // Share to emergency contact via WhatsApp
        const whatsappUrl = `https://wa.me/${EMERGENCY_CONTACT.whatsapp.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      }

      // Record in share history
      setShareHistory([...shareHistory, {
        timestamp: new Date().toISOString(),
        emailContacts: hasEmailContacts ? emailContacts : [],
        phoneContacts: hasPhoneContacts ? phoneContacts : [],
        whatsappUsed: useWhatsApp,
        location,
        emergency,
        shareMethod
      }]);

      const successMessage = emergency ? "🚨 Emergency alert sent!" : "📍 Location shared successfully!";
      alert(successMessage);
      setError(null);
    } catch (err) {
      console.error('Share location error:', err);
      setError("Failed to share location. Please try again.");
    }
  };

  // Start periodic sharing
  const startSharing = () => {
    if (shareInterval > 0) {
      setIsSharing(true);
      shareLocation(); // Share immediately
      
      const intervalId = setInterval(() => {
        if (isTracking) {
          shareLocation();
        }
      }, shareInterval * 60000);
      
      setAutoShareIntervalId(intervalId);
    }
  };

  // Stop periodic sharing
  const stopSharing = () => {
    setIsSharing(false);
    if (autoShareIntervalId) {
      clearInterval(autoShareIntervalId);
      setAutoShareIntervalId(null);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (autoShareIntervalId) {
        clearInterval(autoShareIntervalId);
      }
    };
  }, [watchId, autoShareIntervalId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl opacity-10"></div>
          <div className="relative py-8">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🛡️ Safety Guardian
            </h1>
            <p className="text-lg text-gray-600">
              {isTracking ? "🔴 Live Location Tracking Active" : "Your Personal Safety Companion"}
            </p>
          </div>
        </div>

        {/* Quick Emergency Button - Prominent */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={quickEmergency}
            disabled={!location}
            className={`relative group ${
              location 
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transform hover:scale-105' 
                : 'bg-gray-300 cursor-not-allowed'
            } text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-2xl transition-all duration-300`}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <div className="relative flex items-center space-x-3">
              <span className="text-2xl animate-pulse">🚨</span>
              <span>QUICK EMERGENCY</span>
              <span className="text-2xl animate-pulse">🚨</span>
            </div>
            {!location && (
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-500">
                Enable tracking first
              </div>
            )}
          </button>
        </div>

        {/* Emergency Contact Card */}
        <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-3">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>🚨</span>
              <span>Emergency Contact (Always Available)</span>
            </h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between">
              <div className="flex-1 mb-4 md:mb-0">
                <p className="text-lg font-semibold text-gray-800">{EMERGENCY_CONTACT.name}</p>
                <p className="text-gray-600 text-lg">{EMERGENCY_CONTACT.phone}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => shareToEmergencyWhatsApp(false)}
                  disabled={!location}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    location 
                      ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:scale-105' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  💬 WhatsApp
                </button>
                <button
                  onClick={() => shareToEmergencySMS(false)}
                  disabled={!location}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    location 
                      ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  📱 SMS
                </button>
                <button
                  onClick={() => shareToEmergencyWhatsApp(true)}
                  disabled={!location}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    location 
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl transform hover:scale-105' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  🚨 Emergency
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Control Panel */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Tracking Controls */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center space-x-2">
              <span>📍</span>
              <span>Location Control</span>
            </h3>
            
            <div className="space-y-4">
              {!isTracking ? (
                <button
                  onClick={startTracking}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  📱 Start Live Tracking
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  ⏹️ Stop Tracking
                </button>
              )}
              
              {isTracking && (
                <div className="space-y-3">
                  <button
                    onClick={() => shareLocation(false)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    📤 Share Now
                  </button>
                  <button
                    onClick={() => shareLocation(true)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    🚨 Emergency Alert
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Safety Status */}
          {location && safetyPercentage && (
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center space-x-2">
                <span>🛡️</span>
                <span>Safety Status</span>
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold mb-3">
                    📍 {isTracking ? "Current Location" : "Selected Location"}
                  </h4>
                  <div className="space-y-2 text-gray-700">
                    <p><span className="font-medium">Latitude:</span> {location.lat.toFixed(6)}</p>
                    <p><span className="font-medium">Longitude:</span> {location.lng.toFixed(6)}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 px-4 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg font-medium transition-colors"
                  >
                    🗺️ View on Google Maps
                  </a>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">🛡️ Safety Assessment</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Safety Score</span>
                      <span className="text-2xl font-bold">{safetyPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${
                          safetyPercentage > 70 ? 'bg-gradient-to-r from-green-400 to-green-500' : 
                          safetyPercentage > 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                          'bg-gradient-to-r from-red-400 to-red-500'
                        }`}
                        style={{ width: `${safetyPercentage}%` }}
                      ></div>
                    </div>
                    <p className={`font-medium ${
                      safetyPercentage > 70 ? 'text-green-600' : 
                      safetyPercentage > 40 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {safetyPercentage > 70
                        ? "✅ This area is very safe"
                        : safetyPercentage > 40
                        ? "⚠️ This area is moderately safe"
                        : "🚨 Exercise caution in this area"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border-l-4 border-red-500 shadow-lg">
            <div className="flex items-center space-x-2">
              <span className="text-xl">❌</span>
              <span className="font-medium">Error: {error}</span>
            </div>
          </div>
        )}

        {/* Google Map */}
        <div className="mb-8 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-3">
            <h3 className="text-xl font-bold text-white">🗺️ Interactive Map</h3>
          </div>
          <LoadScript googleMapsApiKey="AIzaSyBSq5E6wSmKSObBafvqqCMI-zek0LDBZqs">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={location || defaultCenter}
              zoom={location ? 15 : 12}
              onClick={!isTracking ? onMapClick : undefined}
              options={{
                styles: [
                  {
                    featureType: "all",
                    elementType: "geometry.fill",
                    stylers: [{ saturation: -15 }]
                  }
                ]
              }}
            >
              {location && (
                <Marker
                  position={location}
                  icon={isTracking ? {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: "#4285F4",
                    fillOpacity: 1,
                    strokeWeight: 3,
                    strokeColor: "#ffffff",
                    scale: 15,
                  } : undefined}
                />
              )}
            </GoogleMap>
          </LoadScript>
        </div>

        {/* Share Method Selector */}
        <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center space-x-2">
            <span>📡</span>
            <span>Communication Preferences</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: "both", icon: "📧📱💬", label: "All Methods" },
              { value: "whatsapp", icon: "💬", label: "WhatsApp Only" },
              { value: "email", icon: "📧", label: "Email Only" },
              { value: "sms", icon: "📱", label: "SMS Only" }
            ].map((method) => (
              <label key={method.value} className="cursor-pointer">
                <input
                  type="radio"
                  value={method.value}
                  checked={shareMethod === method.value}
                  onChange={(e) => setShareMethod(e.target.value)}
                  className="sr-only"
                />
                <div className={`p-4 rounded-xl border-2 text-center transition-all duration-300 ${
                  shareMethod === method.value 
                    ? 'border-blue-500 bg-blue-50 transform scale-105 shadow-lg' 
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}>
                  <div className="text-2xl mb-2">{method.icon}</div>
                  <div className="font-medium text-sm">{method.label}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Contacts Management */}
        <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center space-x-2">
            <span>👥</span>
            <span>Emergency Contacts</span>
          </h3>
          
          {/* Email Contacts */}
          <div className="mb-8">
            <h4 className="text-xl font-semibold mb-4 text-blue-600 flex items-center space-x-2">
              <span>📧</span>
              <span>Email Contacts</span>
            </h4>
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                type="text"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Contact name (optional)"
                className="flex-1 min-w-32 p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
              <input
                type="email"
                value={newEmailContact}
                onChange={(e) => setNewEmailContact(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 min-w-48 p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
              <button
                onClick={addEmailContact}
                disabled={!validateEmail(newEmailContact)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  validateEmail(newEmailContact)
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                ➕ Add
              </button>
            </div>
            
            <div className="space-y-3">
              {emailContacts.map((contact) => (
                <div key={contact.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                  <div>
                    <span className="font-semibold text-gray-800">{contact.name}</span>
                    <br />
                    <span className="text-gray-600 text-sm">{contact.email}</span>
                  </div>
                  <button
                    onClick={() => removeEmailContact(contact.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-all duration-300 font-medium"
                  >
                    🗑️ Remove
                  </button>
                </div>
              ))}
              {emailContacts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📧</div>
                  <p>No email contacts added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Phone Contacts */}
          <div className="mb-6">
            <h4 className="text-xl font-semibold mb-4 text-green-600 flex items-center space-x-2">
              <span>📱</span>
              <span>SMS Contacts</span>
            </h4>
            <div className="flex flex-wrap gap-3 mb-4">
              <input
                type="text"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Contact name (optional)"
                className="flex-1 min-w-32 p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
              />
              <input
                type="tel"
                value={newPhoneContact}
                onChange={(e) => setNewPhoneContact(e.target.value)}
                placeholder="Enter phone number (+1234567890)"
                className="flex-1 min-w-48 p-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
              />
              <button
                onClick={addPhoneContact}
                disabled={!validatePhoneNumber(newPhoneContact)}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  validatePhoneNumber(newPhoneContact)
                    ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                ➕ Add
              </button>
            </div>
            
            <div className="space-y-3">
              {phoneContacts.map((contact) => (
                <div key={contact.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-sm">
                  <div>
                    <span className="font-semibold text-gray-800">{contact.name}</span>
                    <br />
                    <span className="text-gray-600 text-sm">{contact.phone}</span>
                  </div>
                  <button
                    onClick={() => removePhoneContact(contact.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-all duration-300 font-medium"
                  >
                    🗑️ Remove
                  </button>
                </div>
              ))}
              {phoneContacts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📱</div>
                  <p>No SMS contacts added yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Auto Share Settings */}
          {isTracking && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h4 className="text-xl font-semibold mb-4 text-purple-600 flex items-center space-x-2">
                <span>⏰</span>
                <span>Auto Share Settings</span>
              </h4>
              <div className="flex flex-wrap items-center gap-4">
                <select
                  value={shareInterval}
                  onChange={(e) => setShareInterval(Number(e.target.value))}
                  className="p-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                  disabled={isSharing}
                >
                  <option value={0}>Don't auto-share</option>
                  <option value={5}>Every 5 minutes</option>
                  <option value={15}>Every 15 minutes</option>
                  <option value={30}>Every 30 minutes</option>
                  <option value={60}>Every hour</option>
                </select>
                {!isSharing ? (
                  <button
                    onClick={startSharing}
                    disabled={shareInterval === 0}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      shareInterval > 0 
                        ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg hover:shadow-xl transform hover:scale-105' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    ▶️ Start Auto Share
                  </button>
                ) : (
                  <button
                    onClick={stopSharing}
                    className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    ⏹️ Stop Auto Share
                  </button>
                )}
              </div>
              {isSharing && (
                <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <span className="animate-pulse">✅</span>
                    <span className="font-medium">Auto-sharing every {shareInterval} minutes</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Share History */}
        {shareHistory.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center space-x-2">
              <span>📋</span>
              <span>Share History</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <th className="py-4 px-6 text-left font-semibold text-gray-700 rounded-tl-xl">🕒 Time</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">📧 Email</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">📱 SMS</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700">💬 WhatsApp</th>
                    <th className="py-4 px-6 text-left font-semibold text-gray-700 rounded-tr-xl">🚨 Type</th>
                  </tr>
                </thead>
                <tbody>
                  {shareHistory.slice(-10).reverse().map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {item.emailContacts?.map(c => c.name || c.email).join(", ") || "None"}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {item.phoneContacts?.map(c => c.name || c.phone).join(", ") || "None"}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {item.whatsappUsed ? "✅ Emergency Contact" : "None"}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {item.emergency ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            🚨 Emergency
                          </span>
                        ) : item.shareMethod === 'quick_emergency' ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            ⚡ Quick Emergency
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            📍 Regular
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {shareHistory.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg">No sharing history yet</p>
                <p className="text-sm">Your location shares will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center py-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
          <div className="text-gray-600">
            <p className="text-lg font-medium mb-2">🛡️ Stay Safe, Stay Connected</p>
            <p className="text-sm">Your safety is our priority. Keep your emergency contacts updated.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyMap;