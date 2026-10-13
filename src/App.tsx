/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Search, 
  Rocket, 
  X, 
  Menu,
  MapPin,
  Navigation,
  Layers,
  Plus,
  Minus,
  Crosshair,
  MessageCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import L from 'leaflet';

import seekerMarcus from '/src/assets/images/seeker_avatar_marcus_1791872932042.jpg';
import seekerElena from '/src/assets/images/seeker_avatar_elena_1791872932734.jpg';
import seekerDavid from '/src/assets/images/seeker_avatar_david_1791872932998.jpg';
import seekerAmara from '/src/assets/images/seeker_avatar_amara_1791872933384.jpg';

interface OnlineSeeker {
  id: string;
  name: string;
  role: string;
  avatar: string;
  location: string;
  province: string;
  hourlyRate: string;
  availability: string;
  skills: string[];
  bio: string;
  isOnline: boolean;
  coords: [number, number];
}

interface ActiveGig {
  seeker: OnlineSeeker;
  destinationAddress: string;
  destCoords: [number, number];
  seekerCoords: [number, number];
  gigTitle: string;
  agreedRate: string;
  status: 'navigating' | 'completed';
}

const ONLINE_SEEKERS: OnlineSeeker[] = [
  {
    id: 'seeker-1',
    name: 'Marcus Vance',
    role: 'Full-Stack Developer',
    avatar: seekerMarcus,
    location: 'Cape Town Central',
    province: 'Western Cape',
    hourlyRate: 'R450/hr',
    availability: 'Available for immediate hire',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    bio: 'Specialist in modern web applications and responsive interfaces with 6+ years experience.',
    isOnline: true,
    coords: [-33.9188, 18.4233]
  },
  {
    id: 'seeker-2',
    name: 'Elena Rostova',
    role: 'Creative UI/UX Designer',
    avatar: seekerElena,
    location: 'Sandton, Johannesburg',
    province: 'Gauteng',
    hourlyRate: 'R400/hr',
    availability: 'Available this week',
    skills: ['Design Systems', 'Figma', 'Brand Identity', 'Mobile UI'],
    bio: 'Crafting intuitive visual design languages and user-tested prototypes for tech companies.',
    isOnline: true,
    coords: [-26.1076, 28.0567]
  },
  {
    id: 'seeker-3',
    name: 'David Miller',
    role: 'Systems & Hardware Engineer',
    avatar: seekerDavid,
    location: 'Umhlanga, Durban',
    province: 'KwaZulu-Natal',
    hourlyRate: 'R520/hr',
    availability: 'Online now',
    skills: ['IoT', 'Embedded Systems', 'Automation', 'Cloud Infrastructure'],
    bio: 'Hardware integration and embedded IoT infrastructure consultant with background in industrial automation.',
    isOnline: true,
    coords: [-29.7288, 31.0847]
  },
  {
    id: 'seeker-4',
    name: 'Amara Adebayo',
    role: 'Operations & Strategy Lead',
    avatar: seekerAmara,
    location: 'Centurion, Pretoria',
    province: 'Gauteng',
    hourlyRate: 'R480/hr',
    availability: 'Active now',
    skills: ['Operations', 'Growth Strategy', 'Product Mgmt', 'Workflow Design'],
    bio: 'Advising fast-moving ventures on unit economics, operational workflows, and product rollouts.',
    isOnline: true,
    coords: [-25.8603, 28.1894]
  }
];

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<'gigs' | 'seekers' | 'activation' | null>('gigs');
  
  // GiGs Map & Search states
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isSatellite, setIsSatellite] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [targetLocation, setTargetLocation] = useState<{ name: string; lat: number; lng: number } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  // Seekers state
  const [seekerSearchQuery, setSeekerSearchQuery] = useState('');
  const [selectedSeeker, setSelectedSeeker] = useState<OnlineSeeker | null>(null);

  // Hire & Active Gig state
  const [hireModalSeeker, setHireModalSeeker] = useState<OnlineSeeker | null>(null);
  const [hireDestination, setHireDestination] = useState('14 Long Street, Cape Town, Western Cape');
  const [hireGigTitle, setHireGigTitle] = useState('On-Site Technical Task & Implementation');
  const [hireStage, setHireStage] = useState<'form' | 'waiting' | 'accepted'>('form');
  const [activeGig, setActiveGig] = useState<ActiveGig | null>(null);
  const [showCompletedNotification, setShowCompletedNotification] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const seekerMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  const menuOptions = [
    { id: 'gigs', label: 'GiGs', icon: Zap, color: 'bg-amber-50 text-amber-500' },
    { id: 'seekers', label: 'Seekers', icon: Search, color: 'bg-blue-50 text-blue-500' },
    { id: 'activation', label: 'Activation', icon: Rocket, color: 'bg-rose-50 text-rose-500' },
  ];

  // Initialize Map strictly for GiGs feature
  useEffect(() => {
    if (activeFeature === 'gigs' && mapRef.current) {
      if (!mapInstanceRef.current) {
        const defaultLat = activeGig ? activeGig.destCoords[0] : -33.9249;
        const defaultLng = activeGig ? activeGig.destCoords[1] : 18.4241;

        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false
        }).setView([defaultLat, defaultLng], 14);

        const standardUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

        const tileLayer = L.tileLayer(isSatellite ? satelliteUrl : standardUrl, {
          maxZoom: 19,
        }).addTo(map);

        tileLayerRef.current = tileLayer;
        mapInstanceRef.current = map;

        // Get user geolocation if available
        if (navigator.geolocation && !activeGig) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              setUserLocation({ lat, lng });
              if (!targetLocation) {
                map.setView([lat, lng], 14);
              }

              const userIcon = L.divIcon({
                className: 'custom-user-marker',
                html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
              });

              if (userMarkerRef.current) {
                userMarkerRef.current.setLatLng([lat, lng]);
              } else {
                userMarkerRef.current = L.marker([lat, lng], { icon: userIcon }).addTo(map);
              }
            },
            () => {
              console.log('Geolocation permission denied or unavailable');
            },
            { enableHighAccuracy: true }
          );
        }
      } else {
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 100);
      }
    } else if (activeFeature !== 'gigs' && mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
  }, [activeFeature]);

  // Handle Satellite View switch for GiGs map
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
      const standardUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const satelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      
      const newLayer = L.tileLayer(isSatellite ? satelliteUrl : standardUrl, {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
    }
  }, [isSatellite]);

  // Render Active Gig markers & route on the map
  useEffect(() => {
    if (activeFeature === 'gigs' && mapInstanceRef.current && activeGig) {
      const map = mapInstanceRef.current;

      // 1. Destination Marker (User Destination)
      const destIcon = L.divIcon({
        className: 'custom-dest-marker',
        html: `<div style="background-color: #ef4444; width: 28px; height: 28px; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 14px rgba(239,68,68,0.5); display: flex; align-items: center; justify-content: center; color: white;">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
               </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      if (markerRef.current) {
        markerRef.current.setLatLng(activeGig.destCoords);
      } else {
        markerRef.current = L.marker(activeGig.destCoords, { icon: destIcon }).addTo(map);
      }

      // 2. Seeker Marker (Seeker on the way)
      const seekerIcon = L.divIcon({
        className: 'custom-seeker-marker',
        html: `<div style="position: relative; width: 36px; height: 36px;">
                 <img src="${activeGig.seeker.avatar}" style="width: 36px; height: 36px; border-radius: 50%; border: 3px solid #10b981; box-shadow: 0 4px 12px rgba(0,0,0,0.3); object-fit: cover;" />
                 <div style="position: absolute; bottom: -2px; right: -2px; width: 12px; height: 12px; background-color: #10b981; border: 2px solid white; border-radius: 50%;"></div>
               </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      if (seekerMarkerRef.current) {
        seekerMarkerRef.current.setLatLng(activeGig.seekerCoords);
      } else {
        seekerMarkerRef.current = L.marker(activeGig.seekerCoords, { icon: seekerIcon }).addTo(map);
      }

      // 3. Polyline route between seeker and destination
      if (routeLineRef.current) {
        routeLineRef.current.remove();
      }

      // Create a curve/mid-route for realistic navigation
      const midLat = (activeGig.seekerCoords[0] + activeGig.destCoords[0]) / 2 + 0.002;
      const midLng = (activeGig.seekerCoords[1] + activeGig.destCoords[1]) / 2 - 0.003;
      const routePoints: [number, number][] = [
        activeGig.seekerCoords,
        [midLat, midLng],
        activeGig.destCoords
      ];

      const polyline = L.polyline(routePoints, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8'
      }).addTo(map);

      routeLineRef.current = polyline;

      // Fit map to see both seeker and destination
      const bounds = L.latLngBounds([activeGig.seekerCoords, activeGig.destCoords]);
      map.fitBounds(bounds, { padding: [80, 80] });
    }
  }, [activeFeature, activeGig]);

  // GiGs Map Address Search
  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;

    setIsSearchingMap(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&addressdetails=1&limit=5`);
      const data = await response.json();
      setMapSearchResults(data);
      if (data && data.length > 0) {
        selectMapLocation(data[0]);
      }
    } catch (err) {
      console.error('Map search error:', err);
    } finally {
      setIsSearchingMap(false);
    }
  };

  const selectMapLocation = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const name = item.display_name;

    setTargetLocation({ name, lat, lng });
    setMapSearchResults([]);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);

      const targetIcon = L.divIcon({
        className: 'custom-target-marker',
        html: '<div style="background-color: #ef4444; width: 22px; height: 22px; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 12px rgba(239,68,68,0.5); display: flex; align-items: center; justify-content: center;"><div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { icon: targetIcon }).addTo(mapInstanceRef.current);
      }
    }
  };

  // Start Hiring Flow
  const handleStartHire = (seeker: OnlineSeeker) => {
    setHireModalSeeker(seeker);
    setHireStage('form');
  };

  // Submit Hire Request & Simulate Seeker Acceptance
  const handleSendHireRequest = () => {
    if (!hireModalSeeker) return;
    setHireStage('waiting');

    // Simulate seeker accepting the gig offer after 1.5s
    setTimeout(() => {
      setHireStage('accepted');
    }, 1500);
  };

  // Once seeker accepts, direct seeker and user to GiGs feature for navigation
  const handleProceedToGigNavigation = () => {
    if (!hireModalSeeker) return;

    // Use seeker coordinates and calculate nearby destination coordinates
    const destCoords: [number, number] = [
      hireModalSeeker.coords[0] - 0.015,
      hireModalSeeker.coords[1] + 0.012
    ];

    const newGig: ActiveGig = {
      seeker: hireModalSeeker,
      destinationAddress: hireDestination,
      destCoords: destCoords,
      seekerCoords: hireModalSeeker.coords,
      gigTitle: hireGigTitle,
      agreedRate: hireModalSeeker.hourlyRate,
      status: 'navigating'
    };

    setActiveGig(newGig);
    setTargetLocation({
      name: hireDestination,
      lat: destCoords[0],
      lng: destCoords[1]
    });
    setIsNavigating(true);

    // Close modals
    setHireModalSeeker(null);
    setSelectedSeeker(null);

    // Direct to GiGs feature!
    setActiveFeature('gigs');
  };

  // Complete gig
  const handleCompleteGig = () => {
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
    if (seekerMarkerRef.current) {
      seekerMarkerRef.current.remove();
      seekerMarkerRef.current = null;
    }
    setActiveGig(null);
    setIsNavigating(false);
    setShowCompletedNotification(true);
    setTimeout(() => {
      setShowCompletedNotification(false);
    }, 4500);
  };

  // Filter Online Seekers based on search bar input
  const filteredSeekers = ONLINE_SEEKERS.filter((seeker) => {
    if (!seeker.isOnline) return false;
    const query = seekerSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      seeker.name.toLowerCase().includes(query) ||
      seeker.role.toLowerCase().includes(query) ||
      seeker.location.toLowerCase().includes(query) ||
      seeker.province.toLowerCase().includes(query) ||
      seeker.skills.some(skill => skill.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between selection:bg-slate-100 font-sans relative overflow-x-hidden">
      
      {/* Gig Completed Toast Notification */}
      <AnimatePresence>
        {showCompletedNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-semibold"
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span>Gig successfully completed and confirmed!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. GiGs Feature (Interactive Map with Search, Geolocation, Satellite, Navigation) */}
      {activeFeature === 'gigs' && (
        <div className="absolute inset-0 flex flex-col z-10 bg-slate-100">
          {/* Active Gig Top Banner if Seeker was hired */}
          {activeGig && (
            <div className="absolute top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[480px] z-30">
              <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative shrink-0">
                    <img 
                      src={activeGig.seeker.avatar} 
                      alt={activeGig.seeker.name} 
                      className="w-9 h-9 rounded-full object-cover border-2 border-emerald-400"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                      <Navigation className="w-3 h-3 animate-pulse" />
                      <span>Seeker En Route to Destination</span>
                    </span>
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {activeGig.seeker.name} &bull; {activeGig.gigTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCompleteGig}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
                >
                  Complete Gig
                </button>
              </div>
            </div>
          )}

          {/* Top Search Bar (When no active gig or to look up other addresses) */}
          {!activeGig && (
            <div className="absolute top-4 left-6 right-6 sm:left-1/2 sm:-translate-x-1/2 sm:w-[380px] z-30">
              <form onSubmit={handleMapSearch} className="relative">
                <div className="flex items-center bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-4 py-2.5">
                  <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    placeholder="Search home number, street, location..."
                    className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                  {mapSearchQuery && (
                    <button 
                      type="button" 
                      onClick={() => { setMapSearchQuery(''); setMapSearchResults([]); }}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSearchingMap}
                    className="ml-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-medium hover:bg-slate-800 transition-colors shrink-0"
                  >
                    {isSearchingMap ? '...' : 'Search'}
                  </button>
                </div>

                {/* Autocomplete Results */}
                {mapSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-40 max-h-60 overflow-y-auto">
                    {mapSearchResults.map((item, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectMapLocation(item)}
                        className="w-full text-left px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-none flex items-start gap-2.5"
                      >
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{item.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Full Screen Map Container */}
          <div ref={mapRef} className="w-full h-full flex-1 relative z-0" />

          {/* Map Controls */}
          <div className="absolute right-4 top-24 z-20 flex flex-col gap-2">
            <button
              onClick={() => setIsSatellite(!isSatellite)}
              className={`w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg flex items-center justify-center transition-colors ${
                isSatellite ? 'text-blue-600 bg-blue-50/90 border-blue-200' : 'text-slate-700 hover:bg-slate-50'
              }`}
              title="Toggle Satellite View"
            >
              <Layers className="w-5 h-5" />
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
              title="Zoom In"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
              title="Zoom Out"
            >
              <Minus className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (mapInstanceRef.current && activeGig) {
                  const bounds = L.latLngBounds([activeGig.seekerCoords, activeGig.destCoords]);
                  mapInstanceRef.current.fitBounds(bounds, { padding: [80, 80] });
                } else if (mapInstanceRef.current && userLocation) {
                  mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 16);
                } else if (mapInstanceRef.current && targetLocation) {
                  mapInstanceRef.current.setView([targetLocation.lat, targetLocation.lng], 16);
                }
              }}
              className="w-11 h-11 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
              title="Recenter Location"
            >
              <Crosshair className="w-5 h-5" />
            </button>
          </div>

          {/* Active Navigation Panel for Hired Gig */}
          {activeGig && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-28 left-4 right-4 z-30 max-w-md mx-auto bg-slate-900 text-white rounded-3xl p-4 shadow-2xl flex flex-col gap-3 border border-slate-700"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Navigation className="w-4 h-4 animate-spin text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">Turn-by-Turn Gig Navigation</span>
                    <span className="text-[10px] text-slate-400">Navigating to user destination ({activeGig.destinationAddress.split(',')[0]})</span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  8 MINS
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span className="truncate">Follow route north toward destination</span>
                <span className="font-mono text-emerald-400 font-semibold shrink-0 ml-2">1.8 km</span>
              </div>
            </motion.div>
          )}

          {/* Standard Target Location Card when no hired gig */}
          {!activeGig && targetLocation && !isNavigating && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-28 left-4 right-4 z-30 max-w-md mx-auto bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-slate-900 truncate">Selected Location</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">{targetLocation.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsNavigating(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium shadow-md transition-all shrink-0 flex items-center gap-1.5"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate</span>
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* 2. Seekers Feature: Search Bar at the top + List View of Online Seekers with HIRE option */}
      {activeFeature === 'seekers' && (
        <div className="min-h-screen bg-white flex flex-col pt-4 pb-28 px-4 sm:px-6 max-w-2xl mx-auto w-full">
          {/* Top Search Bar */}
          <div className="w-full mb-5 sticky top-4 z-20">
            <div className="flex items-center bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] px-4 py-2.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
              <input
                type="text"
                value={seekerSearchQuery}
                onChange={(e) => setSeekerSearchQuery(e.target.value)}
                placeholder="Search online seekers, skills, province..."
                className="w-full bg-transparent text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {seekerSearchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSeekerSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Header count for Online Seekers */}
          <div className="flex items-center justify-between px-1 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-600">Online Seekers</span>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-medium">
                {filteredSeekers.length}
              </span>
            </div>
            {activeGig && (
              <button
                onClick={() => setActiveFeature('gigs')}
                className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1"
              >
                <span>Active Gig in GiGs</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* List View of Online Seekers */}
          <div className="space-y-3">
            {filteredSeekers.map((seeker) => (
              <motion.div
                key={seeker.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 group"
              >
                <div 
                  onClick={() => setSelectedSeeker(seeker)}
                  className="flex items-start gap-3.5 cursor-pointer flex-1 min-w-0"
                >
                  {/* Profile Picture with Online Badge */}
                  <div className="relative shrink-0">
                    <img
                      src={seeker.avatar}
                      alt={seeker.name}
                      className="w-13 h-13 rounded-2xl object-cover border border-slate-100 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
                  </div>

                  {/* Seeker Information Attached */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {seeker.name}
                      </h3>
                      <span className="text-xs font-semibold text-slate-900 font-mono shrink-0 sm:hidden">
                        {seeker.hourlyRate}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-600 truncate mt-0.5">
                      {seeker.role}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{seeker.location}, {seeker.province}</span>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-1.5">
                      {seeker.bio}
                    </p>
                  </div>
                </div>

                {/* Hire Action Column */}
                <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  <span className="hidden sm:inline-block text-xs font-bold text-slate-900 font-mono">
                    {seeker.hourlyRate}
                  </span>
                  <button
                    onClick={() => handleStartHire(seeker)}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Hire Seeker</span>
                  </button>
                </div>
              </motion.div>
            ))}

            {filteredSeekers.length === 0 && (
              <div className="text-center py-12 text-xs text-slate-400">
                No online seekers found matching "{seekerSearchQuery}".
              </div>
            )}
          </div>

          {/* Seeker Detail Modal */}
          <AnimatePresence>
            {selectedSeeker && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedSeeker(null)}
                  className="absolute inset-0"
                />

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.25 }}
                  className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl z-10 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={selectedSeeker.avatar} 
                          alt={selectedSeeker.name} 
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-100 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{selectedSeeker.name}</h3>
                        <p className="text-xs text-slate-600">{selectedSeeker.role}</p>
                        <span className="text-xs font-semibold text-emerald-600 font-mono">{selectedSeeker.hourlyRate}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedSeeker(null)}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedSeeker.location}, {selectedSeeker.province}</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{selectedSeeker.availability}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedSeeker.bio}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {selectedSeeker.skills.map((skill, index) => (
                      <span key={index} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      handleStartHire(selectedSeeker);
                      setSelectedSeeker(null);
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Hire {selectedSeeker.name}</span>
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Hire Seeker Modal with Acceptance Flow */}
          <AnimatePresence>
            {hireModalSeeker && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setHireModalSeeker(null)}
                  className="absolute inset-0"
                />

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ duration: 0.25 }}
                  className="relative w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl z-10 flex flex-col gap-4"
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Hire for Gig</h3>
                        <p className="text-[11px] text-slate-500">Book {hireModalSeeker.name}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setHireModalSeeker(null)}
                      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Form Stage */}
                  {hireStage === 'form' && (
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <img 
                          src={hireModalSeeker.avatar} 
                          alt={hireModalSeeker.name} 
                          className="w-11 h-11 rounded-xl object-cover"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900 block">{hireModalSeeker.name}</span>
                          <span className="text-[11px] text-slate-500 block">{hireModalSeeker.role}</span>
                          <span className="text-xs font-mono font-bold text-emerald-600">{hireModalSeeker.hourlyRate}</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          User Destination Address
                        </label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                          <input 
                            type="text" 
                            value={hireDestination}
                            onChange={(e) => setHireDestination(e.target.value)}
                            placeholder="Enter street address, city, province"
                            className="bg-transparent w-full text-slate-900 focus:outline-none text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Gig Title / Requirement
                        </label>
                        <input 
                          type="text" 
                          value={hireGigTitle}
                          onChange={(e) => setHireGigTitle(e.target.value)}
                          placeholder="What needs to be done?"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={handleSendHireRequest}
                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2 mt-2"
                      >
                        <span>Send Gig Offer</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Waiting for Seeker Response */}
                  {hireStage === 'waiting' && (
                    <div className="py-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-slate-900 animate-spin mx-auto" />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Waiting for {hireModalSeeker.name} to accept...</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          The gig offer and destination have been dispatched to seeker.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Seeker Accepted Stage */}
                  {hireStage === 'accepted' && (
                    <div className="py-4 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{hireModalSeeker.name} Accepted!</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          Seeker accepted the gig offer and is ready to be directed to GiGs for navigation to your destination.
                        </p>
                      </div>

                      <button
                        onClick={handleProceedToGigNavigation}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
                      >
                        <Navigation className="w-4 h-4" />
                        <span>Proceed to GiGs Navigation</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 3. Activation Feature: Completely Empty Minimalist Canvas */}
      {activeFeature === 'activation' && (
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-xl mx-auto my-auto">
          {/* Empty white space as requested */}
        </main>
      )}

      {/* Bottom Floating Menu & Circle Toggle Container */}
      <div className="fixed bottom-12 left-0 right-0 z-50 flex flex-col items-center pointer-events-none gap-4">
        {/* Floating Options Pill */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.1)] rounded-full px-6 py-3 flex items-center gap-8 max-w-sm mx-auto"
            >
              {menuOptions.map((option) => {
                const Icon = option.icon;
                const isActive = activeFeature === option.id;
                return (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setActiveFeature(option.id as any);
                      setIsMenuOpen(false);
                    }}
                    className="flex flex-col items-center gap-1.5 group focus:outline-none"
                  >
                    <div className={`w-11 h-11 rounded-full ${option.color} flex items-center justify-center shadow-sm transition-transform group-hover:shadow ${isActive ? 'ring-2 ring-slate-900 ring-offset-2' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 tracking-tight">
                      {option.label}
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Circular Toggle Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="pointer-events-auto"
        >
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-14 h-14 rounded-full bg-[#111827] text-white shadow-[0_8px_20px_rgba(17,24,39,0.3)] flex items-center justify-center transition-transform duration-300 hover:bg-[#1f2937] focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
