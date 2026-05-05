import { useState, useEffect, useCallback } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import { getDatos, guardarVisita, invalidarCache } from './api'

const FORM_INICIAL = {
  vendedor: '',
  ciudad: '',
  razonSocial: '',
  encargado: '',
  celular: '',
  mail: '',
  rubro: '',
  unidades: '',
  marcas: [],
  cantNuevas: '',
  precioNuevas: '',
  proveedor: '',
  cantRecons: '',
  precioRecons: '',
  productos: [],
  observaciones: '',
}

function Field({ label, required, children }) {
  return (
    <label className="field">
      <span>{label}{required && ' *'}</span>
      {children}
    </label>
  )
}

export default function App() {
  const [datos, setDatos] = useState(null)
  const [errorCarga, setErrorCarga] = useState(null)
  const [form, setForm] = useState(FORM_INICIAL)
  const [ciudadesFiltradas, setCiudadesFiltradas] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null) // 'ok' | 'error'
  const [recargando, setRecargando] = useState(false)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  useEffect(() => {
    getDatos()
      .then(setDatos)
      .catch(err => setErrorCarga(err.message))
  }, [])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setForm(prev => {
      const next = { ...prev, [name]: value }
      if (name === 'vendedor') next.ciudad = ''
      return next
    })
    if (name === 'vendedor' && datos) {
      setCiudadesFiltradas(datos.ciudades[value] || [])
    }
  }, [datos])

  const totalNuevas = (Number(form.cantNuevas) || 0) * (Number(form.precioNuevas) || 0)
  const totalRecons = (Number(form.cantRecons) || 0) * (Number(form.precioRecons) || 0)

  const parseCelular = (celular) => {
    let num = celular.replace(/\D/g, '')
    if (!num.startsWith('549')) num = '549' + num
    return num
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setResultado(null)

    const requeridos = ['vendedor', 'ciudad', 'razonSocial', 'encargado', 'celular', 'mail', 'rubro', 'unidades', 'cantNuevas', 'precioNuevas', 'proveedor', 'cantRecons', 'precioRecons']
    const falta = requeridos.some(c => !String(form[c]).trim()) || form.marcas.length === 0 || form.productos.length === 0
    if (falta) {
      setResultado('validacion')
      return
    }

    setMostrarConfirmacion(true)
  }

  const confirmarEnvio = async (enviarCopia) => {
    setMostrarConfirmacion(false)
    setEnviando(true)
    try {
      await guardarVisita({
        ...form,
        celular: parseCelular(form.celular),
        marcas: form.marcas.join(', '),
        productos: form.productos.join(', '),
        totalNuevas,
        totalRecons,
        enviarCopia, // Flag para el backend
      })
      setResultado('ok')
      setForm(FORM_INICIAL)
      setCiudadesFiltradas([])
    } catch {
      setResultado('error')
    } finally {
      setEnviando(false)
    }
  }

  const reintentar = () => {
    setErrorCarga(null)
    invalidarCache()
    getDatos().then(setDatos).catch(err => setErrorCarga(err.message))
  }

  const recargarDatos = () => {
    setRecargando(true)
    invalidarCache()
    getDatos()
      .then(setDatos)
      .catch(err => setErrorCarga(err.message))
      .finally(() => setRecargando(false))
  }

  if (errorCarga) return (
    <div className="pantalla-centrada">
      <p className="texto-error">Error al cargar datos: {errorCarga}</p>
      <button className="btn-secundario" onClick={reintentar}>Reintentar</button>
    </div>
  )

  if (!datos) return (
    <div className="pantalla-centrada">
      <div className="spinner" />
      <p>Cargando...</p>
    </div>
  )

  return (
    <div className="container">
      <header className="header">
        <div className="header-banner">
          <img src={`${import.meta.env.BASE_URL}recmil.png`} alt="RecMil" className="header-logo" />
        </div>
        <div className="header-bar">
          <p className="header-subtitulo">Registro de Visita</p>
          <button className="btn-recargar" onClick={recargarDatos} disabled={recargando} title="Recargar datos">
            {recargando ? '...' : '↻'}
          </button>
        </div>
      </header>

      {resultado === 'ok' && (
        <div className="alerta alerta-ok">
          <span>✓ Visita guardada correctamente.</span>
          <button className="btn-link" onClick={() => setResultado(null)}>Registrar otra</button>
        </div>
      )}

      {resultado === 'validacion' && (
        <div className="alerta alerta-error">
          ✗ Completá todos los campos obligatorios antes de enviar.
        </div>
      )}

      {resultado === 'error' && (
        <div className="alerta alerta-error">
          ✗ Hubo un error al guardar. Intentá de nuevo.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault() }}
      >

        {/* ── Vendedor y Ciudad ── */}
        <section className="seccion">
          <h2 className="seccion-titulo">Vendedor y Ciudad</h2>

          <Field label="Vendedor" required>
            <select name="vendedor" value={form.vendedor} onChange={handleChange} required>
              <option value="">Seleccioná un vendedor</option>
              {datos.vendedores.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>

          <Field label="Ciudad" required>
            <select name="ciudad" value={form.ciudad} onChange={handleChange} required disabled={!form.vendedor}>
              <option value="">
                {form.vendedor ? 'Seleccioná una ciudad' : 'Primero elegí un vendedor'}
              </option>
              {ciudadesFiltradas.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </section>

        {/* ── Datos del Cliente ── */}
        <section className="seccion">
          <h2 className="seccion-titulo">Datos del Cliente</h2>

          <Field label="Razón Social" required>
            <input name="razonSocial" value={form.razonSocial} onChange={handleChange} required placeholder="Empresa S.A." />
          </Field>
          <Field label="Nombre Encargado" required>
            <input name="encargado" value={form.encargado} onChange={handleChange} placeholder="Juan García" />
          </Field>
          <Field label="Celular" required>
            <input name="celular" type="tel" value={form.celular} onChange={handleChange} placeholder="1112345678" />
          </Field>
          <Field label="Email" required>
            <input name="mail" type="email" value={form.mail} onChange={handleChange} placeholder="contacto@empresa.com" />
          </Field>
          <Field label="Rubro" required>
            <select name="rubro" value={form.rubro} onChange={handleChange}>
              <option value="">Seleccioná un rubro</option>
              {(datos.rubros || []).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Cantidad de Unidades" required>
            <input name="unidades" type="number" min="0" value={form.unidades} onChange={handleChange} />
          </Field>
          <Field label="Marcas" required>
            <Autocomplete
              multiple
              options={datos.marcas || []}
              value={form.marcas}
              onChange={(_, newValue) => setForm(prev => ({ ...prev, marcas: newValue }))}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} size="small" {...getTagProps({ index })} key={option} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} placeholder="Buscá o seleccioná marcas" size="small" />
              )}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: '1rem' } }}
            />
          </Field>
        </section>

        {/* ── Cubiertas Nuevas ── */}
        <section className="seccion">
          <h2 className="seccion-titulo">Cubiertas Nuevas</h2>

          <Field label="Cantidad mensual" required>
            <input name="cantNuevas" type="number" min="0" value={form.cantNuevas} onChange={handleChange} />
          </Field>
          <Field label="Precio unitario" required>
            <input name="precioNuevas" type="number" min="0" step="0.01" value={form.precioNuevas} onChange={handleChange} />
          </Field>
          {totalNuevas > 0 && (
            <p className="total">Total: ${totalNuevas.toLocaleString('es-AR')}</p>
          )}
        </section>

        {/* ── Reconstrucción ── */}
        <section className="seccion">
          <h2 className="seccion-titulo">Reconstrucción</h2>

          <Field label="Proveedor" required>
            <input name="proveedor" value={form.proveedor} onChange={handleChange} />
          </Field>
          <Field label="Cantidad mensual" required>
            <input name="cantRecons" type="number" min="0" value={form.cantRecons} onChange={handleChange} />
          </Field>
          <Field label="Precio unitario" required>
            <input name="precioRecons" type="number" min="0" step="0.01" value={form.precioRecons} onChange={handleChange} />
          </Field>
          {totalRecons > 0 && (
            <p className="total">Total: ${totalRecons.toLocaleString('es-AR')}</p>
          )}
        </section>

        {/* ── Adicionales ── */}
        <section className="seccion">
          <h2 className="seccion-titulo">Productos</h2>

          <Field label="Productos" required>
            <Autocomplete
              multiple
              options={datos.productos || []}
              value={form.productos}
              onChange={(_, newValue) => setForm(prev => ({ ...prev, productos: newValue }))}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip label={option} size="small" {...getTagProps({ index })} key={option} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} placeholder="Buscá o seleccioná productos" size="small" />
              )}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '9px', fontSize: '1rem' } }}
            />
          </Field>
        </section>
        <section className="seccion">
          <h2 className="seccion-titulo">Observaciones</h2>
            <Field label="Observaciones">
              <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} />
            </Field>
        </section>

        <button type="submit" className="btn-submit" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Guardar Visita'}
        </button>
      </form>

      {mostrarConfirmacion && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-titulo">¿Enviar copia?</h3>
            <p className="modal-texto">
              ¿Querés recibir una copia de tus respuestas por mail en un PDF?
              Se enviará a: <strong>{form.mail}</strong>
            </p>
            <div className="modal-acciones">
              <button className="btn-modal-si" onClick={() => confirmarEnvio(true)}>
                Sí, enviar copia
              </button>
              <button className="btn-modal-no" onClick={() => confirmarEnvio(false)}>
                No, solo guardar
              </button>
              <button className="btn-link" style={{ textAlign: 'center', marginTop: '0.5rem' }} onClick={() => setMostrarConfirmacion(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
