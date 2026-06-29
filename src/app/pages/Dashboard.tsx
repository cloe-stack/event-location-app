import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getLocations, deleteLocation, type Location } from '../lib/locations';
import { signOut, getCurrentUser } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { 
  MapPin, 
  Plus, 
  LogOut, 
  Search, 
  Trash2, 
  Eye, 
  Edit,
  Users,
  Square,
  Car,
  Trees,
  Waves,
  Music,
  Utensils,
  Clock,
  Lightbulb,
  Filter,
  X
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

export function Dashboard() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    parking: false,
    jardin: false,
    terraza: false,
    piscina: false,
    musica: false,
    cocina: false,
    diurna: false,
    nocturna: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterLocations();
  }, [searchQuery, locations, filters]);

  const loadData = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setUserName(user.name);
      }

      const data = await getLocations();
      setLocations(data);
      setFilteredLocations(data);
    } catch (error: any) {
      console.error('Error loading locations:', error);
      // If authentication error, redirect to login
      if (error.message?.includes('authentication') || error.message?.includes('token')) {
        toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        await signOut();
        navigate('/');
      } else {
        toast.error('Error al cargar las localizaciones');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterLocations = () => {
    let filtered = [...locations];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(loc => {
        // Search in basic fields
        const matchesBasic = loc.nombre.toLowerCase().includes(query) ||
          loc.comentarios.toLowerCase().includes(query) ||
          (loc.calle || "").toLowerCase().includes(query) ||
          (loc.ciudad || "").toLowerCase().includes(query) ||
          (loc.provincia || "").toLowerCase().includes(query) ||
          (loc.codigoPostal || "").toLowerCase().includes(query);
        
        // Search in contacts
        const matchesContacts = loc.contactos?.some(contact =>
          contact.nombre.toLowerCase().includes(query) ||
          contact.telefono.toLowerCase().includes(query) ||
          contact.email.toLowerCase().includes(query)
        );
        
        return matchesBasic || matchesContacts;
      });
    }

    // Apply feature filters
    if (filters.parking) {
      filtered = filtered.filter(loc => loc.accesoParkingSi);
    }
    if (filters.jardin) {
      filtered = filtered.filter(loc => loc.jardin);
    }
    if (filters.terraza) {
      filtered = filtered.filter(loc => loc.terraza);
    }
    if (filters.piscina) {
      filtered = filtered.filter(loc => loc.piscina);
    }
    if (filters.musica) {
      filtered = filtered.filter(loc => loc.posibilidadMusica);
    }
    if (filters.cocina) {
      filtered = filtered.filter(loc => loc.cocina);
    }
    if (filters.diurna) {
      filtered = filtered.filter(loc => loc.franjaHoraria === 'diurna' || loc.franjaHoraria === 'ambas');
    }
    if (filters.nocturna) {
      filtered = filtered.filter(loc => loc.franjaHoraria === 'nocturna' || loc.franjaHoraria === 'ambas');
    }

    setFilteredLocations(filtered);
  };

  const toggleFilter = (filterName: keyof typeof filters) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      parking: false,
      jardin: false,
      terraza: false,
      piscina: false,
      musica: false,
      cocina: false,
      diurna: false,
      nocturna: false,
    });
    setSearchQuery('');
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const handleLogout = async () => {
    await signOut();
    toast.success('Sesión cerrada');
    navigate('/');
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      await deleteLocation(deleteId);
      toast.success('Localización eliminada');
      setLocations(locations.filter(loc => loc.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      toast.error('Error al eliminar la localización');
      console.error('Error deleting location:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando localizaciones...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Localizaciones</h1>
                <p className="text-sm text-gray-600">Bienvenido, {userName}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats - Solo total */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <CardDescription>Total Localizaciones</CardDescription>
              <CardTitle className="text-4xl">{locations.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
            <CardHeader className="pb-3">
              <CardDescription className="text-indigo-900">Resultados Filtrados</CardDescription>
              <div className="flex items-baseline gap-2">
                <CardTitle className="text-4xl text-indigo-700">{filteredLocations.length}</CardTitle>
                <span className="text-sm text-indigo-600">
                  de {locations.length} localizaciones
                </span>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Buscar por nombre, ciudad, contacto o comentarios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-white text-indigo-600">{activeFiltersCount}</Badge>
              )}
            </Button>
            <Button onClick={() => navigate('/locations/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Localización
            </Button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filtrar por características</h3>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="w-4 h-4 mr-2" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                <Button
                  variant={filters.parking ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('parking')}
                  className="justify-start"
                >
                  <Car className="w-4 h-4 mr-2" />
                  Parking
                </Button>
                <Button
                  variant={filters.jardin ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('jardin')}
                  className="justify-start"
                >
                  <Trees className="w-4 h-4 mr-2" />
                  Jardín
                </Button>
                <Button
                  variant={filters.terraza ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('terraza')}
                  className="justify-start"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Terraza
                </Button>
                <Button
                  variant={filters.piscina ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('piscina')}
                  className="justify-start"
                >
                  <Waves className="w-4 h-4 mr-2" />
                  Piscina
                </Button>
                <Button
                  variant={filters.musica ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('musica')}
                  className="justify-start"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Música
                </Button>
                <Button
                  variant={filters.cocina ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('cocina')}
                  className="justify-start"
                >
                  <Utensils className="w-4 h-4 mr-2" />
                  Cocina
                </Button>
                <Button
                  variant={filters.diurna ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('diurna')}
                  className="justify-start"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Diurna
                </Button>
                <Button
                  variant={filters.nocturna ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFilter('nocturna')}
                  className="justify-start"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Nocturna
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Locations Grid */}
        {filteredLocations.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || activeFiltersCount > 0 ? 'No se encontraron resultados' : 'No hay localizaciones'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || activeFiltersCount > 0
                ? 'Intenta con otros criterios de búsqueda' 
                : 'Comienza agregando tu primera localización'}
            </p>
            {!searchQuery && activeFiltersCount === 0 && (
              <Button onClick={() => navigate('/locations/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Localización
              </Button>
            )}
            {(searchQuery || activeFiltersCount > 0) && (
              <Button onClick={clearAllFilters} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Limpiar búsqueda y filtros
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <Card key={location.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {/* Image Preview */}
                {location.images && location.images.length > 0 && (
                  <div className="w-full h-48 overflow-hidden bg-gray-100">
                    <img 
                      src={location.images[0].url} 
                      alt={location.nombre}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-1">{location.nombre}</CardTitle>
                      {(location.calle || location.ciudad) && (
                        <p className="text-sm text-gray-500 mb-1">
                          {[location.calle, location.ciudad, location.provincia].filter(Boolean).join(', ')}
                        </p>
                      )}
                      {location.contactos && location.contactos.length > 0 && (
                        <CardDescription>
                          {location.contactos[0].nombre || location.contactos[0].telefono || location.contactos[0].email || 'Sin contacto'}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={location.franjaHoraria === 'ambas' ? 'default' : 'secondary'}>
                      {location.franjaHoraria}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Key Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Square className="w-4 h-4 text-gray-500" />
                      <span>{location.metros2} m²</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>{location.aforo} pers.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{location.horarioMaximo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-gray-500" />
                      <span>{location.potenciaLuz}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {location.accesoParkingSi && (
                      <Badge variant="outline" className="gap-1">
                        <Car className="w-3 h-3" />
                        Parking
                      </Badge>
                    )}
                    {location.jardin && (
                      <Badge variant="outline" className="gap-1">
                        <Trees className="w-3 h-3" />
                        Jardín
                      </Badge>
                    )}
                    {location.piscina && (
                      <Badge variant="outline" className="gap-1">
                        <Waves className="w-3 h-3" />
                        Piscina
                      </Badge>
                    )}
                    {location.posibilidadMusica && (
                      <Badge variant="outline" className="gap-1">
                        <Music className="w-3 h-3" />
                        Música
                      </Badge>
                    )}
                    {location.cocina && (
                      <Badge variant="outline" className="gap-1">
                        <Utensils className="w-3 h-3" />
                        Cocina
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/locations/${location.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/locations/${location.id}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteId(location.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La localización será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}