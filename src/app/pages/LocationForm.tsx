import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { createLocation, updateLocation, getLocation, uploadImage, deleteImage, type LocationFormData, type Contact, type LocationImage } from '../lib/locations';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Save, Plus, Trash2, Upload, X, Image as ImageIcon, FileImage } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export function LocationForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingBlueprint, setIsUploadingBlueprint] = useState(false);

  // Basic info
  const [nombre, setNombre] = useState('');
  const [calle, setCalle] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [codigoPostal, setCodigoPostal] = useState('');
  const [provincia, setProvincia] = useState('');
  const [contactos, setContactos] = useState<Contact[]>([
    { id: crypto.randomUUID(), nombre: '', telefono: '', email: '' }
  ]);
  const [images, setImages] = useState<LocationImage[]>([]);
  const [blueprints, setBlueprints] = useState<LocationImage[]>([]);

  // Dimensions & capacity
  const [metros2, setMetros2] = useState('');
  const [aforoExterior, setAforoExterior] = useState('');
  const [aforoInterior, setAforoInterior] = useState('');
  const [numeroBanos, setNumeroBanos] = useState('');
  const [precio, setPrecio] = useState('');

  // Facilities
  const [accesoParkingSi, setAccesoParkingSi] = useState(false);
  const [jardin, setJardin] = useState(false);
  const [terraza, setTerraza] = useState(false);
  const [piscina, setPiscina] = useState(false);
  const [cocina, setCocina] = useState(false);

  // Schedule
  const [franjaHoraria, setFranjaHoraria] = useState<'diurna' | 'nocturna' | 'ambas'>('diurna');
  const [horarioExterior, setHorarioExterior] = useState('');
  const [horarioInterior, setHorarioInterior] = useState('');
  const [horarioMontaje, setHorarioMontaje] = useState('');
  const [horarioDesmontaje, setHorarioDesmontaje] = useState('');

  // Music
  const [musicaExterior, setMusicaExterior] = useState(false);
  const [musicaInterior, setMusicaInterior] = useState(false);

  // Exclusivities
  const [exclusividadCatering, setExclusividadCatering] = useState(false);
  const [exclusividadAudiovisuales, setExclusividadAudiovisuales] = useState(false);
  const [exclusividadOtros, setExclusividadOtros] = useState(false);

  // Includes
  const [incluyeSeguridad, setIncluyeSeguridad] = useState(false);
  const [incluyeMantenimiento, setIncluyeMantenimiento] = useState(false);
  const [incluyeLimpieza, setIncluyeLimpieza] = useState(false);

  // Other
  const [potenciaLuz, setPotenciaLuz] = useState('');
  const [comentarios, setComentarios] = useState('');

  useEffect(() => {
    if (isEditing && id) loadLocation(id);
  }, [id, isEditing]);

  const loadLocation = async (locationId: string) => {
    try {
      const location = await getLocation(locationId);
      if (location) {
        setNombre(location.nombre);
        setCalle(location.calle || '');
        setCiudad(location.ciudad || '');
        setCodigoPostal(location.codigoPostal || '');
        setProvincia(location.provincia || '');
        setContactos(location.contactos?.length > 0 ? location.contactos : [{ id: crypto.randomUUID(), nombre: '', telefono: '', email: '' }]);
        setImages(location.images || []);
        setBlueprints(location.blueprints || []);
        setMetros2(location.metros2?.toString() || '');
        setAforoExterior(location.aforoExterior?.toString() || '');
        setAforoInterior(location.aforoInterior?.toString() || '');
        setNumeroBanos(location.numeroBanos?.toString() || '');
        setPrecio(location.precio?.toString() || '');
        setAccesoParkingSi(location.accesoParkingSi || false);
        setJardin(location.jardin || false);
        setTerraza(location.terraza || false);
        setPiscina(location.piscina || false);
        setCocina(location.cocina || false);
        setFranjaHoraria(location.franjaHoraria || 'diurna');
        setHorarioExterior(location.horarioExterior || '');
        setHorarioInterior(location.horarioInterior || '');
        setHorarioMontaje(location.horarioMontaje || '');
        setHorarioDesmontaje(location.horarioDesmontaje || '');
        setMusicaExterior(location.musicaExterior || false);
        setMusicaInterior(location.musicaInterior || false);
        setExclusividadCatering(location.exclusividadCatering || false);
        setExclusividadAudiovisuales(location.exclusividadAudiovisuales || false);
        setExclusividadOtros(location.exclusividadOtros || false);
        setIncluyeSeguridad(location.incluyeSeguridad || false);
        setIncluyeMantenimiento(location.incluyeMantenimiento || false);
        setIncluyeLimpieza(location.incluyeLimpieza || false);
        setPotenciaLuz(location.potenciaLuz || '');
        setComentarios(location.comentarios || '');
      }
    } catch (error) {
      toast.error('Error al cargar la localización');
      navigate('/dashboard');
    } finally {
      setIsFetching(false);
    }
  };

  const addContact = () => setContactos([...contactos, { id: crypto.randomUUID(), nombre: '', telefono: '', email: '' }]);
  const removeContact = (id: string) => { if (contactos.length > 1) setContactos(contactos.filter(c => c.id !== id)); };
  const updateContact = (id: string, field: keyof Contact, value: string) => setContactos(contactos.map(c => c.id === id ? { ...c, [field]: value } : c));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map(f => uploadImage(f)));
      setImages([...images, ...uploaded]);
      toast.success(`${uploaded.length} foto(s) subida(s)`);
    } catch { toast.error('Error al subir fotos'); }
    finally { setIsUploadingImage(false); e.target.value = ''; }
  };

  const handleBlueprintUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingBlueprint(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map(f => uploadImage(f)));
      setBlueprints([...blueprints, ...uploaded]);
      toast.success(`${uploaded.length} plano(s) subido(s)`);
    } catch { toast.error('Error al subir planos'); }
    finally { setIsUploadingBlueprint(false); e.target.value = ''; }
  };

  const handleRemoveImage = async (index: number) => {
    try {
      await deleteImage(images[index].filePath);
      setImages(images.filter((_, i) => i !== index));
      toast.success('Foto eliminada');
    } catch { toast.error('Error al eliminar foto'); }
  };

  const handleRemoveBlueprint = async (index: number) => {
    try {
      await deleteImage(blueprints[index].filePath);
      setBlueprints(blueprints.filter((_, i) => i !== index));
      toast.success('Plano eliminado');
    } catch { toast.error('Error al eliminar plano'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validContactos = contactos.filter(c => c.nombre || c.telefono || c.email);
      const { supabase: supabaseClient } = await import('../lib/supabase');
      const { data: sessionData } = await supabaseClient.auth.getSession();
      const userName = sessionData?.session?.user?.user_metadata?.name || sessionData?.session?.user?.email || '';

      const data: LocationFormData = {
        nombre, calle, ciudad, codigoPostal, provincia,
        contactos: validContactos, images, blueprints,
        metros2: parseFloat(metros2) || 0,
        aforoExterior: parseInt(aforoExterior) || 0,
        aforoInterior: parseInt(aforoInterior) || 0,
        numeroBanos: parseInt(numeroBanos) || 0,
        precio: parseFloat(precio) || 0,
        accesoParkingSi, jardin, terraza, piscina, cocina,
        franjaHoraria, horarioExterior, horarioInterior,
        horarioMontaje, horarioDesmontaje,
        musicaExterior, musicaInterior,
        exclusividadCatering, exclusividadAudiovisuales, exclusividadOtros,
        incluyeSeguridad, incluyeMantenimiento, incluyeLimpieza,
        potenciaLuz, comentarios,
        createdBy: userName,
        createdByEmail: sessionData?.session?.user?.email || '',
      };

      if (isEditing && id) {
        await updateLocation(id, data);
        toast.success('Localización actualizada');
      } else {
        await createLocation(data);
        toast.success('Localización creada');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error('Error al guardar la localización');
      console.error('Error saving location:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="min-h-screen flex items-center justify-center"><p>Cargando...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-xl font-bold">{isEditing ? 'Editar Localización' : 'Nueva Localización'}</h1>
          <Button type="submit" form="location-form" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form id="location-form" onSubmit={handleSubmit} className="space-y-8">

          {/* Basic Info */}
          <Card>
            <CardHeader><CardTitle>Información Básica</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input id="nombre" value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Villa La Paz" />
              </div>
              <h3 className="font-semibold">Dirección</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Calle y número</Label>
                  <Input value={calle} onChange={e => setCalle(e.target.value)} placeholder="Ej: Calle Gran Vía 45" />
                </div>
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Input value={ciudad} onChange={e => setCiudad(e.target.value)} placeholder="Ej: Madrid" />
                </div>
                <div className="space-y-2">
                  <Label>Código Postal</Label>
                  <Input value={codigoPostal} onChange={e => setCodigoPostal(e.target.value)} placeholder="Ej: 28013" />
                </div>
                <div className="space-y-2">
                  <Label>Provincia</Label>
                  <Input value={provincia} onChange={e => setProvincia(e.target.value)} placeholder="Ej: Madrid" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card>
            <CardHeader><CardTitle>Contactos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {contactos.map((contact, index) => (
                <div key={contact.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">Contacto {index + 1}</span>
                    {contactos.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeContact(contact.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Nombre</Label>
                      <Input value={contact.nombre} onChange={e => updateContact(contact.id, 'nombre', e.target.value)} placeholder="Nombre" />
                    </div>
                    <div className="space-y-1">
                      <Label>Teléfono</Label>
                      <Input value={contact.telefono} onChange={e => updateContact(contact.id, 'telefono', e.target.value)} placeholder="600 000 000" />
                    </div>
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input type="email" value={contact.email} onChange={e => updateContact(contact.id, 'email', e.target.value)} placeholder="email@ejemplo.com" />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addContact}>
                <Plus className="w-4 h-4 mr-2" /> Añadir contacto
              </Button>
            </CardContent>
          </Card>

          {/* Photos */}
          <Card>
            <CardHeader><CardTitle>Fotos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <label>
                  <Button type="button" variant="outline" disabled={isUploadingImage} asChild>
                    <span><Upload className="w-4 h-4 mr-2" />{isUploadingImage ? 'Subiendo...' : 'Subir Fotos'}</span>
                  </Button>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img.url} alt="" className="w-full h-32 object-cover rounded-lg" />
                      <button type="button" onClick={() => handleRemoveImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No hay fotos</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blueprints */}
          <Card>
            <CardHeader><CardTitle>Planos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <label>
                  <Button type="button" variant="outline" disabled={isUploadingBlueprint} asChild>
                    <span><FileImage className="w-4 h-4 mr-2" />{isUploadingBlueprint ? 'Subiendo...' : 'Subir Planos'}</span>
                  </Button>
                  <input type="file" accept="image/*,.pdf" multiple className="hidden" onChange={handleBlueprintUpload} />
                </label>
              </div>
              {blueprints.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {blueprints.map((bp, i) => (
                    <div key={i} className="relative group">
                      <img src={bp.url} alt="" className="w-full h-32 object-cover rounded-lg" />
                      <button type="button" onClick={() => handleRemoveBlueprint(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center text-gray-500">
                  <FileImage className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No hay planos</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dimensions & Capacity */}
          <Card>
            <CardHeader><CardTitle>Dimensiones y Capacidad</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Metros cuadrados</Label>
                  <Input type="number" value={metros2} onChange={e => setMetros2(e.target.value)} min="0" placeholder="200" />
                </div>
                <div className="space-y-2">
                  <Label>Aforo Exterior</Label>
                  <Input type="number" value={aforoExterior} onChange={e => setAforoExterior(e.target.value)} min="0" placeholder="100" />
                </div>
                <div className="space-y-2">
                  <Label>Aforo Interior</Label>
                  <Input type="number" value={aforoInterior} onChange={e => setAforoInterior(e.target.value)} min="0" placeholder="100" />
                </div>
                <div className="space-y-2">
                  <Label>Cantidad de baños</Label>
                  <Input type="number" value={numeroBanos} onChange={e => setNumeroBanos(e.target.value)} min="0" placeholder="2" />
                </div>
                <div className="space-y-2">
                  <Label>Precio (€)</Label>
                  <Input type="number" value={precio} onChange={e => setPrecio(e.target.value)} min="0" placeholder="5000" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader><CardTitle>Horarios</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Franja Horaria</Label>
                  <Select value={franjaHoraria} onValueChange={(v) => setFranjaHoraria(v as 'diurna' | 'nocturna' | 'ambas')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diurna">Diurna</SelectItem>
                      <SelectItem value="nocturna">Nocturna</SelectItem>
                      <SelectItem value="ambas">Ambas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Horario Exterior</Label>
                  <Input type="time" value={horarioExterior} onChange={e => setHorarioExterior(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Horario Interior</Label>
                  <Input type="time" value={horarioInterior} onChange={e => setHorarioInterior(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Horario Montaje</Label>
                  <Input type="time" value={horarioMontaje} onChange={e => setHorarioMontaje(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Horario Desmontaje</Label>
                  <Input type="time" value={horarioDesmontaje} onChange={e => setHorarioDesmontaje(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Facilities */}
          <Card>
            <CardHeader><CardTitle>Instalaciones</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: 'Acceso a Parking', value: accesoParkingSi, set: setAccesoParkingSi },
                  { label: 'Jardín', value: jardin, set: setJardin },
                  { label: 'Terraza', value: terraza, set: setTerraza },
                  { label: 'Piscina', value: piscina, set: setPiscina },
                  { label: 'Cocina', value: cocina, set: setCocina },
                ].map(({ label, value, set }) => (
                  <div key={label} className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="cursor-pointer">{label}</Label>
                    <Switch checked={value} onCheckedChange={set} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Music */}
          <Card>
            <CardHeader><CardTitle>Música</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Música Exterior</Label>
                  <Switch checked={musicaExterior} onCheckedChange={setMusicaExterior} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Música Interior</Label>
                  <Switch checked={musicaInterior} onCheckedChange={setMusicaInterior} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exclusivities */}
          <Card>
            <CardHeader><CardTitle>Exclusividades</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Exclusividad Catering</Label>
                  <Switch checked={exclusividadCatering} onCheckedChange={setExclusividadCatering} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Exclusividad Audiovisuales</Label>
                  <Switch checked={exclusividadAudiovisuales} onCheckedChange={setExclusividadAudiovisuales} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Exclusividad Otros</Label>
                  <Switch checked={exclusividadOtros} onCheckedChange={setExclusividadOtros} />
                </div>
              </div>
              {exclusividadOtros && (
                <p className="text-sm text-gray-500 italic">💡 Si hay exclusividad de otros proveedores, indícalo en los comentarios.</p>
              )}
            </CardContent>
          </Card>

          {/* Includes */}
          <Card>
            <CardHeader><CardTitle>Incluye</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Seguridad</Label>
                  <Switch checked={incluyeSeguridad} onCheckedChange={setIncluyeSeguridad} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Mantenimiento</Label>
                  <Switch checked={incluyeMantenimiento} onCheckedChange={setIncluyeMantenimiento} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <Label>Limpieza</Label>
                  <Switch checked={incluyeLimpieza} onCheckedChange={setIncluyeLimpieza} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other */}
          <Card>
            <CardHeader><CardTitle>Otros detalles</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Potencia de luz</Label>
                <Input value={potenciaLuz} onChange={e => setPotenciaLuz(e.target.value)} placeholder="Ej: 10 kW" />
              </div>
              <div className="space-y-2">
                <Label>Comentarios</Label>
                <Textarea value={comentarios} onChange={e => setComentarios(e.target.value)} placeholder="Información adicional..." rows={4} />
              </div>
            </CardContent>
          </Card>

        </form>
      </main>
    </div>
  );
}
