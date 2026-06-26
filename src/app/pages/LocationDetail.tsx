import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { getLocation, deleteLocation, type Location } from '../lib/locations';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Users,
  Square,
  Car,
  Trees,
  Waves,
  Music,
  Utensils,
  Clock,
  Lightbulb,
  Home,
  Calendar,
  MessageSquare,
  Check,
  X,
  User,
  Phone,
  Mail,
  Image as ImageIcon
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
import { Separator } from '../components/ui/separator';

export function LocationDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (id) {
      loadLocation(id);
    }
  }, [id]);

  const loadLocation = async (locationId: string) => {
    try {
      const data = await getLocation(locationId);
      setLocation(data);
    } catch (error) {
      toast.error('Error al cargar la localización');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteLocation(id);
      toast.success('Localización eliminada');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al eliminar la localización');
      console.error('Error deleting location:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Localización no encontrada</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Button>

        <div className="space-y-6">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                    <CardTitle className="text-3xl">{location.nombre}</CardTitle>
                  </div>
                  {(location.calle || location.ciudad || location.provincia) && (
                    <div className="flex items-center gap-2 text-gray-500 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">
                        {[location.calle, location.ciudad, location.codigoPostal, location.provincia].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <Badge 
                  variant={location.franjaHoraria === 'ambas' ? 'default' : 'secondary'}
                  className="text-sm px-3 py-1"
                >
                  {location.franjaHoraria.charAt(0).toUpperCase() + location.franjaHoraria.slice(1)}
                </Badge>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={() => navigate(`/locations/${id}/edit`)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Images Gallery */}
          {location.images && location.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Galería de Fotos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {location.images.map((image, index) => (
                    <div key={index} className="group relative overflow-hidden rounded-lg border">
                      <img
                        src={image.url}
                        alt={`${location.nombre} - Imagen ${index + 1}`}
                        className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contacts */}
          {location.contactos && location.contactos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información de Contacto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {location.contactos.map((contacto, index) => (
                    <div key={contacto.id} className="border rounded-lg p-4 space-y-2">
                      <div className="font-semibold text-sm text-gray-500 mb-3">
                        Contacto {index + 1}
                      </div>
                      {contacto.nombre && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{contacto.nombre}</span>
                        </div>
                      )}
                      {contacto.telefono && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <a href={`tel:${contacto.telefono}`} className="text-indigo-600 hover:underline">
                            {contacto.telefono}
                          </a>
                        </div>
                      )}
                      {contacto.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a href={`mailto:${contacto.email}`} className="text-indigo-600 hover:underline">
                            {contacto.email}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dimensions & Capacity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Square className="w-5 h-5" />
                  Dimensiones y Capacidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Metros cuadrados</span>
                  <span className="font-semibold">{location.metros2} m²</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Aforo
                  </span>
                  <span className="font-semibold">{location.aforo} personas</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Número de baños
                  </span>
                  <span className="font-semibold">{location.numeroBanos}</span>
                </div>
              </CardContent>
            </Card>

            {/* Schedule & Technical */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Horario y Técnico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Franja horaria</span>
                  <span className="font-semibold capitalize">{location.franjaHoraria}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Horario máximo</span>
                  <span className="font-semibold">{location.horarioMaximo}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Potencia de luz
                  </span>
                  <span className="font-semibold">{location.potenciaLuz}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Facilities */}
          <Card>
            <CardHeader>
              <CardTitle>Instalaciones y Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${location.accesoParkingSi ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  {location.accesoParkingSi ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex items-center gap-2">
                    <Car className="w-5 h-5" />
                    <span className="font-medium">Parking</span>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-4 rounded-lg border ${location.jardin ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  {location.jardin ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex items-center gap-2">
                    <Trees className="w-5 h-5" />
                    <span className="font-medium">Jardín</span>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-4 rounded-lg border ${location.terraza ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  {location.terraza ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    <span className="font-medium">Terraza</span>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-4 rounded-lg border ${location.piscina ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  {location.piscina ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex items-center gap-2">
                    <Waves className="w-5 h-5" />
                    <span className="font-medium">Piscina</span>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-4 rounded-lg border ${location.cocina ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  {location.cocina ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex items-center gap-2">
                    <Utensils className="w-5 h-5" />
                    <span className="font-medium">Cocina</span>
                  </div>
                </div>

                <div className={`flex items-center gap-3 p-4 rounded-lg border ${location.posibilidadMusica ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  {location.posibilidadMusica ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <X className="w-5 h-5 text-gray-400" />
                  )}
                  <div className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    <span className="font-medium">Música</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          {location.comentarios && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comentarios Adicionales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{location.comentarios}</p>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Creado el {new Date(location.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {location.updatedAt !== location.createdAt && (
                  <>
                    <span className="mx-2">•</span>
                    <span>
                      Última actualización: {new Date(location.updatedAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La localización "{location.nombre}" será eliminada permanentemente.
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