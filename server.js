const express = require('express')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()

const app = express()

app.use(cors())
app.use(express.json())

const db = new sqlite3.Database('./database.db')

db.serialize(() => {

  /* ================= TENDERS ================= */

  db.run(`
    CREATE TABLE IF NOT EXISTS tenders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      budget TEXT,
      deadline TEXT,
      status TEXT
    )
  `)

  /* ================= OFFERS ================= */

  db.run(`
  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenderId INTEGER,
    supplier TEXT,
    price TEXT
  )
`)
  /* ================= SUPPLIERS ================= */

  db.run(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT
    )
  `)
})

/* ================================================= */
/* ==================== TENDERS ==================== */
/* ================================================= */

app.get('/tenders', (req, res) => {

  db.all(
    'SELECT * FROM tenders',
    [],
    (err, rows) => {

      if (err) {
        res.status(500).json(err)
        return
      }

      res.json(rows)
    },
  )
})

app.post('/tenders', (req, res) => {

  const {
    title,
    budget,
    deadline,
    status,
  } = req.body

  db.run(
    `
    INSERT INTO tenders(title, budget, deadline, status)
    VALUES (?, ?, ?, ?)
    `,
    [
      title,
      budget,
      deadline,
      status,
    ],

    function (err) {

      if (err) {
        res.status(500).json(err)
        return
      }

      res.json({
        id: this.lastID,
        title,
        budget,
        deadline,
        status,
      })
    },
  )
})

app.put('/tenders/:id', (req, res) => {

  const { status } = req.body

  db.run(
    `
    UPDATE tenders
    SET status = ?
    WHERE id = ?
    `,
    [status, req.params.id],
    function (err) {

      if (err) {

        res.status(500).json(err)
        return
      }

      res.json({
        success: true,
      })
    },
  )
})

app.delete('/tenders/:id', (req, res) => {

  db.run(
    'DELETE FROM tenders WHERE id = ?',
    [req.params.id],

    function (err) {

      if (err) {
        res.status(500).json(err)
        return
      }

      res.json({
        success: true,
      })
    },
  )
})

/* ================================================= */
/* ===================== OFFERS ==================== */
/* ================================================= */

app.get('/offers', (req, res) => {

  db.all(
    'SELECT * FROM offers',
    [],
    (err, rows) => {

      if (err) {
        res.status(500).json(err)
        return
      }

      res.json(rows)
    },
  )
})

app.post('/offers', (req, res) => {

  const {
    supplier,
    price,
    tenderId,
  } = req.body

  db.run(
    `
    INSERT INTO offers(supplier, price, tenderId)
    VALUES (?, ?, ?)
    `,
    [
      supplier,
      price,
      tenderId,
    ],

    function (err) {

      if (err) {
        res.status(500).json(err)
        return
      }

      res.json({
        id: this.lastID,
        supplier,
        price,
        tenderId,
      })
    },
  )
})

app.delete('/offers/:id', (req, res) => {

  db.run(
    'DELETE FROM offers WHERE id = ?',
    [req.params.id],

    function (err) {

      if (err) {
        res.status(500).json(err)
        return
      }

      res.json({
        success: true,
      })
    },
  )
})

/* ================================================= */
/* =================== SUPPLIERS =================== */
/* ================================================= */

app.get('/suppliers', (req, res) => {

  db.all(
    'SELECT * FROM suppliers',
    [],
    (err, rows) => {

      if (err) {
        res.status(500).json(err)
        return
      }

      res.json(rows)
    },
  )
})

app.post('/suppliers', (req, res) => {

  const {
    name,
    email,
  } = req.body

  db.run(
    `
    INSERT INTO suppliers(name, email)
    VALUES (?, ?)
    `,
    [
      name,
      email,
    ],

    function (err) {

      if (err) {
        res.status(500).json(err)
        return
      }

      res.json({
        id: this.lastID,
        name,
        email,
      })
    },
  )
})

app.delete('/suppliers/:id', (req, res) => {

  db.run(
    'DELETE FROM suppliers WHERE id = ?',
    [req.params.id],

    function (err) {

      if (err) {
        res.status(500).json(err)
        return
      }

      res.json({
        success: true,
      })
    },
  )
})

/* ================================================= */
/* ====================== STATS ==================== */
/* ================================================= */

app.get('/stats', (req, res) => {

  db.all(
    `
    SELECT
      (SELECT COUNT(*) FROM tenders) as tenders,
      (SELECT COUNT(*) FROM offers) as offers,
      (SELECT COUNT(*) FROM suppliers) as suppliers
    `,
    [],
    (err, rows) => {

      if (err) {
        res.status(500).json(err)
        return
      }

      res.json(rows[0])
    },
  )
})

/* ================================================= */
/* ====================== SERVER =================== */
/* ================================================= */
 /* ================================================= */
/* ===================== UPDATES =================== */
/* ================================================= */

app.get('/updates', (req, res) => {

  const updates = []

  db.all(
    `
    SELECT * FROM offers
    ORDER BY id DESC
    LIMIT 5
    `,
    [],
    (err, offers) => {

      if (err) {
        res.status(500).json(err)
        return
      }

      offers.forEach((offer) => {

        updates.push({
          type: 'offer',
          text: `${offer.supplier} submitted a new offer`,
        })
      })

      db.all(
        `
        SELECT * FROM tenders
        ORDER BY id DESC
        LIMIT 5
        `,
        [],
        (err, tenders) => {

          if (err) {
            res.status(500).json(err)
            return
          }

          tenders.forEach((tender) => {

            updates.push({
              type: 'tender',
              text: `Tender "${tender.title}" was published`,
            })
          })

          db.all(
            `
            SELECT * FROM suppliers
            ORDER BY id DESC
            LIMIT 5
            `,
            [],
            (err, suppliers) => {

              if (err) {
                res.status(500).json(err)
                return
              }

              suppliers.forEach((supplier) => {

                updates.push({
                  type: 'supplier',
                  text: `${supplier.name} joined the platform`,
                })
              })

              res.json(updates.reverse())
            },
          )
        },
      )
    },
  )
}) 
app.listen(5000, () => {
  console.log('Server running on port 5000')
})