import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { createLocation, updateLocation, getLocation, uploadImage, deleteImage, type LocationFormData, type Contact, type LocationImage } from '../lib/locations';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Trash2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export function LocationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [contactos, setContactos] = useState<Contact[]>([
    { id: crypto.randomUUID(), nombre: '', telefono: '', email: '' }
  ]);
  const [images, setImages] = useState<LocationImage[]>([]);
  const [metros2, setMetros2] = useState('');
  const [aforo, setAforo] = useState('');
  const [accesoParkingSi, setAccesoParkingSi] = useState(false);
  const [jardin, setJardin] = useState(false);
  const [terraza, setTerraza] = useState(false);
  const [piscina, setPiscina] = useState(false);
  const [numeroBanos, setNumeroBanos] = useState('');
  const [cocina, setCocina] = useState(false);
  const [franjaHoraria, setFranjaHoraria] = useState<'diurna' | 'nocturna' | 'ambas'>('diurna');
  const [horarioMaximo, setHorarioMaximo] = useState('');
  const [posibilidadMusica, setPosibilidadMusica] = useState(false);
  const [potenciaLuz, setPotenciaLuz] = useState('');
  const [comentarios, setComentarios] = useState('');

  useEffect(() => {
    if (isEditing && id) {
      loadLocation(id);
    }
  }, [id, isEditing]);

  const loadLocation = async (locationId: string) => {
    try {
      const location = await getLocation(locationId);
      if (location) {
        setNombre(location.nombre);
        setContactos(location.contactos?.length > 0 ? location.contactos : [{ id: crypto.randomUUID(), nombre: '', telefono: '', email: '' }]);
        setImages(location.images || []);
        setMetros2(location.metros2.toString());
        setAforo(location.aforo.toString());
        setAccesoParkingSi(location.accesoParkingSi);
        setJardin(location.jardin);
        setTerraza(location.terraza);
        setPiscina(location.piscina);
        setNumeroBanos(location.numeroBanos.toString());
        setCocina(location.cocina);
        setFranjaHoraria(location.franjaHoraria);
        setHorarioMaximo(location.horarioMaximo);
        setPosibilidadMusica(location.posibilidadMusica);
        setPotenciaLuz(location.potenciaLuz);
        setComentarios(location.comentarios);
      }
    } catch (error) {
      toast.error('Error al cargar la localización');
      navigate('/dashboard');
    } finally {
      setIsFetching(false);
    }
  };

  const addContact = () => {
    setContactos([...contactos, { id: crypto.randomUUID(), nombre: '', telefono: '', email: '' }]);
  };

  const removeContact = (id: string) => {
    if (contactos.length > 1) {
      setContactos(contactos.filter(c => c.id !== id));
    }
  };

  const updateContact = (id: string, field: keyof Contact, value: string) => {
    setContactos(contactos.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const uploadedImages = await Promise.all(uploadPromises);
      setImages([...images, ...uploadedImages]);
      toast.success(`${uploadedImages.length} imagen(es) subida(s) con éxito`);
    } catch (error) {
      toast.error('Error al subir las imágenes');
      console.error('Error uploading images:', error);
    } finally {
      setIsUploadingImage(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (index: number) => {
    const image = images[index];
    try {
      await deleteImage(image.filePath);
      setImages(images.filter((_, i) => i !== index));
      toast.success('Imagen eliminada');
    } catch (error) {
      toast.error('Error al eliminar la imagen');
      console.error('Error deleting image:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Filter out empty contacts
      const validContactos = contactos.filter(c => c.nombre || c.telefono || c.email);

      const data: LocationFormData = {
        nombre,
        contactos: validContactos,
        images,
        metros2: parseFloat(metros2) || 0,
        aforo: parseInt(aforo) || 0,
        accesoParkingSi,
        jardin,
        terraza,
        piscina,
        numeroBanos: parseInt(numeroBanos) || 0,
        cocina,
        franjaHoraria,
        horarioMaximo,
        posibilidadMusica,
        potenciaLuz,
        comentarios,
      };

      if (isEditing && id) {
        await updateLocation(id, data);
        toast.success('Localización actualizada con éxito');
      } else {
        await createLocation(data);
        toast.success('Localización creada con éxito');
      }

      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al guardar la localización');
      console.error('Error saving location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {isEditing ? 'Editar Localización' : 'Nueva Localización'}
            </CardTitle>
            <CardDescription>
              Completa todos los campos con la información de la localización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Básica</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la localización *</Label>
                  <Input
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    placeholder="Ej: Salón Los Olivos"
                  />
                </div>
              </div>

              {/* Contacts Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Contactos</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addContact}>
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir Contacto
                  </Button>
                </div>
                
                {contactos.map((contacto, index) => (
                  <Card key={contacto.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Contacto {index + 1}</Label>
                        {contactos.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeContact(contacto.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor={`nombre-${contacto.id}`} className="text-sm">Nombre</Label>
                          <Input
                            id={`nombre-${contacto.id}`}
                            value={contacto.nombre}
                            onChange={(e) => updateContact(contacto.id, 'nombre', e.target.value)}
                            placeholder="Juan Pérez"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor={`telefono-${contacto.id}`} className="text-sm">Teléfono</Label>
                          <Input
                            id={`telefono-${contacto.id}`}
                            value={contacto.telefono}
                            onChange={(e) => updateContact(contacto.id, 'telefono', e.target.value)}
                            placeholder="600 123 456"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label htmlFor={`email-${contacto.id}`} className="text-sm">Email</Label>
                          <Input
                            id={`email-${contacto.id}`}
                            type="email"
                            value={contacto.email}
                            onChange={(e) => updateContact(contacto.id, 'email', e.target.value)}
                            placeholder="juan@example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Images Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Fotos de la Localización</h3>
                  <div>
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('image-upload')?.click()}
                      disabled={isUploadingImage}
                    >
                      {isUploadingImage ? (
                        <>Subiendo...</>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Subir Fotos
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.url}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>No hay fotos. Haz clic en "Subir Fotos" para añadir imágenes.</p>
                  </div>
                )}
              </div>

              {/* Dimensions & Capacity */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dimensiones y Capacidad</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="metros2">Metros cuadrados *</Label>
                    <Input
                      id="metros2"
                      type="number"
                      value={metros2}
                      onChange={(e) => setMetros2(e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      placeholder="200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aforo">Aforo (personas) *</Label>
                    <Input
                      id="aforo"
                      type="number"
                      value={aforo}
                      onChange={(e) => setAforo(e.target.value)}
                      required
                      min="0"
                      placeholder="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numeroBanos">Número de baños *</Label>
                    <Input
                      id="numeroBanos"
                      type="number"
                      value={numeroBanos}
                      onChange={(e) => setNumeroBanos(e.target.value)}
                      required
                      min="0"
                      placeholder="2"
                    />
                  </div>
                </div>
              </div>

              {/* Facilities */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Instalaciones</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="parking" className="cursor-pointer">Acceso a parking</Label>
                    <Switch
                      id="parking"
                      checked={accesoParkingSi}
                      onCheckedChange={setAccesoParkingSi}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="jardin" className="cursor-pointer">Jardín</Label>
                    <Switch
                      id="jardin"
                      checked={jardin}
                      onCheckedChange={setJardin}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="terraza" className="cursor-pointer">Terraza</Label>
                    <Switch
                      id="terraza"
                      checked={terraza}
                      onCheckedChange={setTerraza}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="piscina" className="cursor-pointer">Piscina</Label>
                    <Switch
                      id="piscina"
                      checked={piscina}
                      onCheckedChange={setPiscina}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="cocina" className="cursor-pointer">Cocina</Label>
                    <Switch
                      id="cocina"
                      checked={cocina}
                      onCheckedChange={setCocina}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label htmlFor="musica" className="cursor-pointer">Posibilidad de música</Label>
                    <Switch
                      id="musica"
                      checked={posibilidadMusica}
                      onCheckedChange={setPosibilidadMusica}
                    />
                  </div>
                </div>
              </div>

              {/* Schedule & Technical */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Horario y Especificaciones Técnicas</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="franjaHoraria">Franja horaria *</Label>
                    <Select value={franjaHoraria} onValueChange={(value: any) => setFranjaHoraria(value)}>
                      <SelectTrigger id="franjaHoraria">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diurna">Diurna</SelectItem>
                        <SelectItem value="nocturna">Nocturna</SelectItem>
                        <SelectItem value="ambas">Ambas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horarioMaximo">Horario máximo *</Label>
                    <Input
                      id="horarioMaximo"
                      type="time"
                      value={horarioMaximo}
                      onChange={(e) => setHorarioMaximo(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="potenciaLuz">Potencia de luz *</Label>
                    <Input
                      id="potenciaLuz"
                      value={potenciaLuz}
                      onChange={(e) => setPotenciaLuz(e.target.value)}
                      required
                      placeholder="Ej: 10 kW"
                    />
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Comentarios Adicionales</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="comentarios">Comentarios</Label>
                  <Textarea
                    id="comentarios"
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                    placeholder="Información adicional relevante sobre la localización..."
                    rows={4}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}