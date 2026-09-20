import React, { useState, useMemo } from 'react';
import { 
  Bus, 
  Train, 
  Car, 
  Ship, 
  Plane, 
  Footprints,
  Users, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Truck,
  AlertCircle,
  Filter
} from 'lucide-react';
import { fleetService } from '../../services/fleetService';
import { TransportFleetItem } from '../../types';
import { 
  validateVehicle, 
  SupportedVehicleType, 
  VEHICLE_TYPE_LABELS 
} from '../../data/vehicleImages';
import { VehicleCardImage } from './VehicleCardImage';

interface TransportFleetStatusProps {
  darkMode?: boolean;
  onSelectVehicle?: (vehicle: TransportFleetItem) => void;
}

export const TransportFleetStatus: React.FC<TransportFleetStatusProps> = ({
  darkMode = true,
  onSelectVehicle,
}) => {
  const [fleet, setFleet] = useState<TransportFleetItem[]>(fleetService.getFleet());
  const [reservedIds, setReservedIds] = useState<Record<string, number>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | SupportedVehicleType>('ALL');

  const handleReserve = (vehicle: TransportFleetItem) => {
    const success = fleetService.reserveSeats(vehicle.id, 1);
    if (success) {
      setFleet(fleetService.getFleet());
      setReservedIds(prev => ({ ...prev, [vehicle.id]: (prev[vehicle.id] || 0) + 1 }));
      setFeedbackMsg(`1 Seat reserved on ${vehicle.title} (${vehicle.regOrId}). ETA ${vehicle.etaMin} min.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    }
  };

  const getModeIcon = (type: SupportedVehicleType) => {
    switch (type) {
      case 'bus': return <Bus className="w-3.5 h-3.5 text-blue-400" />;
      case 'train': return <Train className="w-3.5 h-3.5 text-indigo-400" />;
      case 'car': return <Car className="w-3.5 h-3.5 text-amber-400" />;
      case 'rescue_vehicle': return <Truck className="w-3.5 h-3.5 text-orange-400" />;
      case 'ambulance': return <Bus className="w-3.5 h-3.5 text-rose-400" />;
      case 'boat': return <Ship className="w-3.5 h-3.5 text-cyan-400" />;
      case 'helicopter': return <Plane className="w-3.5 h-3.5 text-purple-400" />;
      case 'walking': return <Footprints className="w-3.5 h-3.5 text-emerald-400" />;
      default: return <Bus className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  // Validate all vehicles before rendering (strict spec requirement)
  const validatedFleet = useMemo(() => {
    return fleet.map(item => {
      const validated = validateVehicle({
        id: item.id,
        type: item.type,
        title: item.title,
        image: item.imageUrl,
        capacity: item.capacity,
        availableSeats: item.available !== undefined ? item.available : item.availableSeats,
        occupied: item.occupied,
      });

      return {
        rawItem: item,
        validated,
      };
    });
  }, [fleet]);

  const filteredFleet = useMemo(() => {
    if (selectedFilter === 'ALL') {
      return validatedFleet;
    }
    return validatedFleet.filter(f => f.validated.type === selectedFilter);
  }, [validatedFleet, selectedFilter]);

  const filterOptions: { key: 'ALL' | SupportedVehicleType; label: string }[] = [
    { key: 'ALL', label: 'All Units' },
    { key: 'bus', label: 'Bus' },
    { key: 'train', label: 'Train' },
    { key: 'car', label: 'Car' },
    { key: 'rescue_vehicle', label: 'Rescue Vehicle' },
    { key: 'ambulance', label: 'Ambulance' },
    { key: 'boat', label: 'Boat' },
    { key: 'helicopter', label: 'Helicopter' },
    { key: 'walking', label: 'Walking' },
  ];

  return (
    <div 
      className={`p-4 sm:p-5 rounded-2xl border text-left space-y-4 transition-colors ${
        darkMode ? 'bg-slate-900/80 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
      aria-label="Transport Fleet Status"
    >
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5 ${
        darkMode ? 'border-slate-800/80' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-500 flex items-center justify-center border border-blue-500/30 shrink-0">
            <Bus className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xs font-black uppercase tracking-wider ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Multimodal Evacuation Fleet
              </h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-900/40 text-blue-400 border border-blue-600/40">
                LIVE STAGING
              </span>
            </div>
            <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Verified authentic evacuation buses, trains, cars, rescue vehicles, ambulances, boats &amp; helicopters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border ${
            darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            {fleet.length} active units
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <span className={`text-[10px] font-semibold flex items-center gap-1 mr-1 shrink-0 ${
          darkMode ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <Filter className="w-3 h-3" />
          Filter:
        </span>
        {filterOptions.map((opt) => {
          const isActive = selectedFilter === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setSelectedFilter(opt.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                  : darkMode
                  ? 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {feedbackMsg && (
        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Grid of fleet cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredFleet.map(({ rawItem, validated }) => {
          const isReserved = (reservedIds[validated.id] || 0) > 0;
          const isWalking = validated.type === 'walking';

          return (
            <div
              key={validated.id}
              className={`rounded-xl border p-3 flex flex-col justify-between space-y-3 transition-all ${
                darkMode 
                  ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700 shadow-md' 
                  : 'bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-sm'
              }`}
            >
              <div className="space-y-2.5">
                {/* Vehicle Image Container with Exact Type Matching */}
                <div className={`relative h-32 w-full rounded-lg overflow-hidden border ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <VehicleCardImage
                    type={validated.type}
                    image={validated.image}
                    alt={`${validated.title} (${VEHICLE_TYPE_LABELS[validated.type]})`}
                    darkMode={darkMode}
                    className="w-full h-full"
                  />

                  {/* ID / Reg Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/85 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1.5 border border-slate-700/80 shadow-md">
                    {getModeIcon(validated.type)}
                    <span>{rawItem.regOrId}</span>
                  </div>

                  {/* ETA Badge */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-blue-600/90 backdrop-blur-md text-[10px] font-extrabold text-white shadow-md">
                    ETA {rawItem.etaMin} min
                  </div>
                </div>

                {/* Card Information */}
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs font-bold truncate ${
                      darkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {rawItem.title}
                    </h4>
                    <span className="text-[10px] font-extrabold text-emerald-500 shrink-0">
                      {validated.availableSeats} seats avail
                    </span>
                  </div>

                  <div className={`text-[11px] mt-1 flex items-center gap-1.5 truncate ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{rawItem.pickupLocation}</span>
                  </div>

                  <div className={`text-[10px] truncate mt-0.5 ${
                    darkMode ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Route: {rawItem.routeDescription}
                  </div>
                </div>
              </div>

              {/* Action / Capacity Footer */}
              <div className={`pt-2.5 border-t flex items-center justify-between gap-2 ${
                darkMode ? 'border-slate-800/80' : 'border-slate-200'
              }`}>
                <div className={`text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Capacity: <b className={darkMode ? 'text-white' : 'text-slate-900'}>{validated.occupied}/{validated.capacity}</b>
                </div>

                <button
                  onClick={() => {
                    handleReserve(rawItem);
                    if (onSelectVehicle) onSelectVehicle(rawItem);
                  }}
                  disabled={validated.availableSeats <= 0}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    validated.availableSeats <= 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : isReserved
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                  }`}
                >
                  {validated.availableSeats <= 0 ? 'Full' : isReserved ? 'Seat Confirmed' : isWalking ? 'Join Group' : 'Reserve Seat'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
