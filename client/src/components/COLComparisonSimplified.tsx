import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SimpleCityCard } from './SimpleCityCard';
import {
  getWageEstimate,
  metroData,
  metroLabels,
  type Occupation,
  type CareerLevel,
  type Metro,
  getCOLMultiplier,
} from '@/data/bls-wage-data';
import { getAllInternationalCities, getCitiesByRegion } from '@/data/international-cities';
import { quickEstimate } from '@/lib/geographic-calculations';

interface COLComparisonProps {
  currentMetro: Metro;
  currentSalary: number;
  currentNetWorth: number;
  age: number;
  occupation: Occupation;
  level: CareerLevel;
  savingsRate: number;
  yearsOfHistoricalData: number; // For retrospective calculation
}

export function COLComparisonSimplified({
  currentMetro,
  currentSalary,
  currentNetWorth,
  age,
  occupation,
  level,
  savingsRate,
  yearsOfHistoricalData = 0,
}: COLComparisonProps) {
  const currentCOL = getCOLMultiplier(currentMetro);

  // Get US metros (excluding current)
  const usMetros = useMemo(() => {
    return Object.entries(metroData)
      .filter(([metroId]) => metroId !== currentMetro)
      .map(([metroId, data]) => {
        const metro = metroId as Metro;
        const wageEstimate = getWageEstimate(occupation, level, metro);
        const salaryMultiplier = wageEstimate.totalComp / currentSalary;

        return {
          id: metro,
          name: metroLabels[metro],
          flag: '🇺🇸',
          salaryMultiplier,
          colMultiplier: data.colIndex / 100, // Convert index to multiplier
        };
      });
  }, [currentMetro, occupation, level, currentSalary]);

  // Get international cities by region
  const internationalByRegion = useMemo(() => {
    return getCitiesByRegion();
  }, []);

  // Calculation handler
  const handleCalculate = (
    cityId: string,
    type: 'retrospective' | 'prospective',
    years: number
  ) => {
    // Find city (could be US or international)
    const usCity = usMetros.find(c => c.id === cityId);
    const intCity = getAllInternationalCities().find(c => c.id === cityId);
    const city = usCity || intCity;

    if (!city) {
      return { adjustedNetWorth: currentNetWorth, delta: 0 };
    }

    return quickEstimate(
      currentNetWorth,
      currentSalary,
      savingsRate,
      city.salaryMultiplier,
      city.colMultiplier,
      currentCOL,
      years,
      type === 'retrospective'
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          🌍 Geographic Arbitrage: What If I Moved?
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Compare net worth impact across US cities and international locations
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="us" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="us">🇺🇸 US Cities</TabsTrigger>
            <TabsTrigger value="europe">🇪🇺 Europe</TabsTrigger>
            <TabsTrigger value="asia">🌏 Asia-Pacific</TabsTrigger>
            <TabsTrigger value="middleeast">🕌 Middle East</TabsTrigger>
            <TabsTrigger value="americas">🌎 Americas</TabsTrigger>
            <TabsTrigger value="africa">🌍 Africa</TabsTrigger>
          </TabsList>

          {/* US Cities */}
          <TabsContent value="us" className="space-y-3 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {usMetros.map(city => (
                <SimpleCityCard
                  key={city.id}
                  city={city}
                  currentSalary={currentSalary}
                  currentNetWorth={currentNetWorth}
                  yearsOfData={yearsOfHistoricalData}
                  onCalculate={handleCalculate}
                />
              ))}
            </div>
          </TabsContent>

          {/* Europe */}
          <TabsContent value="europe" className="space-y-3 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {internationalByRegion['Europe']?.map(city => (
                <SimpleCityCard
                  key={city.id}
                  city={city}
                  currentSalary={currentSalary}
                  currentNetWorth={currentNetWorth}
                  yearsOfData={yearsOfHistoricalData}
                  onCalculate={handleCalculate}
                />
              ))}
            </div>
          </TabsContent>

          {/* Asia-Pacific */}
          <TabsContent value="asia" className="space-y-3 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {internationalByRegion['Asia-Pacific']?.map(city => (
                <SimpleCityCard
                  key={city.id}
                  city={city}
                  currentSalary={currentSalary}
                  currentNetWorth={currentNetWorth}
                  yearsOfData={yearsOfHistoricalData}
                  onCalculate={handleCalculate}
                />
              ))}
            </div>
          </TabsContent>

          {/* Middle East */}
          <TabsContent value="middleeast" className="space-y-3 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {internationalByRegion['Middle East']?.map(city => (
                <SimpleCityCard
                  key={city.id}
                  city={city}
                  currentSalary={currentSalary}
                  currentNetWorth={currentNetWorth}
                  yearsOfData={yearsOfHistoricalData}
                  onCalculate={handleCalculate}
                />
              ))}
            </div>
          </TabsContent>

          {/* Americas (non-US) */}
          <TabsContent value="americas" className="space-y-3 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {internationalByRegion['Americas']?.map(city => (
                <SimpleCityCard
                  key={city.id}
                  city={city}
                  currentSalary={currentSalary}
                  currentNetWorth={currentNetWorth}
                  yearsOfData={yearsOfHistoricalData}
                  onCalculate={handleCalculate}
                />
              ))}
            </div>
          </TabsContent>

          {/* Africa */}
          <TabsContent value="africa" className="space-y-3 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {internationalByRegion['Africa']?.map(city => (
                <SimpleCityCard
                  key={city.id}
                  city={city}
                  currentSalary={currentSalary}
                  currentNetWorth={currentNetWorth}
                  yearsOfData={yearsOfHistoricalData}
                  onCalculate={handleCalculate}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Info Footer */}
        <p className="text-xs text-muted-foreground text-center mt-6 pt-4 border-t">
          Data sources: BLS OES 2023 (US), Numbeo Cost of Living Index, Levels.fyi International Compensation
        </p>
      </CardContent>
    </Card>
  );
}
