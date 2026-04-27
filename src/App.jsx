import { useState, useEffect, useCallback } from 'react'
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
  marcas: '',
  cantNuevas: '',
  precioNuevas: '',
  proveedor: '',
  cantRecons: '',
  precioRecons: '',
  productos: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setResultado(null)
    try {
      await guardarVisita({ ...form, totalNuevas, totalRecons })
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
        <h1>Registro de Visita</h1>
      </header>

      {resultado === 'ok' && (
        <div className="alerta alerta-ok">
          <span>✓ Visita guardada correctamente.</span>
          <button className="btn-link" onClick={() => setResultado(null)}>Registrar otra</button>
        </div>
      )}

      {resultado === 'error' && (
        <div className="alerta alerta-error">
          ✗ Hubo un error al guardar. Intentá de nuevo.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>

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
          <Field label="Nombre Encargado">
            <input name="encargado" value={form.encargado} onChange={handleChange} placeholder="Juan García" />
          </Field>
          <Field label="Celular">
            <input name="celular" type="tel" value={form.celular} onChange={handleChange} placeholder="+54 9 11 1234-5678" />
          </Field>
          <Field label="Email">
            <input name="mail" type="email" value={form.mail} onChange={handleChange} placeholder="contacto@empresa.com" />
          </Field>
          <Field label="Rubro">
            <input name="rubro" value={form.rubro} onChange={handleChange} placeholder="Transporte, Agro..." />
          </Field>
          <Field label="Cantidad de Unidades">
            <input name="unidades" type="number" min="0" value={form.unidades} onChange={handleChange} />
          </Field>
          <Field label="Marcas">
            <input name="marcas" value={form.marcas} onChange={handleChange} />
          </Field>
        </section>

        {/* ── Cubiertas Nuevas ── */}
        <section className="seccion">
          <h2 className="seccion-titulo">Cubiertas Nuevas</h2>

          <Field label="Cantidad mensual">
            <input name="cantNuevas" type="number" min="0" value={form.cantNuevas} onChange={handleChange} />
          </Field>
          <Field label="Precio unitario">
            <input name="precioNuevas" type="number" min="0" step="0.01" value={form.precioNuevas} onChange={handleChange} />
          </Field>
          {totalNuevas > 0 && (
            <p className="total">Total: ${totalNuevas.toLocaleString('es-AR')}</p>
          )}
        </section>

        {/* ── Reconstrucción ── */}
        <section className="seccion">
          <h2 className="seccion-titulo">Reconstrucción</h2>

          <Field label="Proveedor">
            <input name="proveedor" value={form.proveedor} onChange={handleChange} />
          </Field>
          <Field label="Cantidad mensual">
            <input name="cantRecons" type="number" min="0" value={form.cantRecons} onChange={handleChange} />
          </Field>
          <Field label="Precio unitario">
            <input name="precioRecons" type="number" min="0" step="0.01" value={form.precioRecons} onChange={handleChange} />
          </Field>
          {totalRecons > 0 && (
            <p className="total">Total: ${totalRecons.toLocaleString('es-AR')}</p>
          )}
        </section>

        {/* ── Adicionales ── */}
        <section className="seccion">
          <h2 className="seccion-titulo">Adicionales</h2>

          <Field label="Productos">
            <input name="productos" value={form.productos} onChange={handleChange} />
          </Field>
          <Field label="Observaciones">
            <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} />
          </Field>
        </section>

        <button type="submit" className="btn-submit" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Guardar Visita'}
        </button>
      </form>
    </div>
  )
}
