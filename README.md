# DataViz Dashboard

A production-ready data visualization dashboard. Upload CSV/Excel files or connect to a PostgreSQL/MySQL database, then build interactive charts from your data.

## Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Recharts
- **Backend**: Node.js + Express + Prisma
- **Database**: PostgreSQL (app metadata only)

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (optional — required only for saving charts)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL if you have PostgreSQL
npm install
```

**With PostgreSQL** (to enable saved charts):
```bash
npm run db:push        # creates tables
npm run db:generate    # generates Prisma client
npm run dev
```

**Without PostgreSQL** (file upload + charts still work, saving disabled):
```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Environment Variables

### backend/.env

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/dataviz"
PORT=4000
NODE_ENV=development
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=./uploads
FRONTEND_URL=http://localhost:5173
```

### frontend/.env

```env
VITE_API_BASE_URL=http://localhost:4000
```

---

## API Reference

### File APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload CSV/Excel file (multipart, field: `file`) |
| GET | `/api/upload/preview?datasetId=` | Fetch first 50 rows of a dataset |

### Database APIs

| Method | Endpoint | Headers | Description |
|--------|----------|---------|-------------|
| POST | `/api/db/connect` | — | Connect to PostgreSQL/MySQL |
| POST | `/api/db/disconnect` | `x-session-id` | Disconnect |
| GET | `/api/db/tables` | `x-session-id` | List tables |
| GET | `/api/db/table-data?table=` | `x-session-id` | Fetch table rows |

### Chart APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/charts/generate` | Generate chart data |
| POST | `/api/charts/save` | Save chart config (requires DB) |
| GET | `/api/charts/saved?datasetId=` | List saved charts |
| DELETE | `/api/charts/:id` | Delete a saved chart |

---

## Sample Data

A sample CSV is included at `sample_data/sales_data.csv`.

Upload it to immediately see:
- **Bar chart**: Sales by region or product
- **Line chart**: Sales trend over time (date × sales)
- **Pie chart**: Revenue distribution by category

---

## Project Structure

```
backend/
  controllers/     # Request handlers (thin — delegate to services)
  routes/          # Express routers
  services/
    fileParser.js  # CSV/Excel parsing + column type inference
    dbConnector.js # Dynamic PG/MySQL connections per session
    chartService.js # Aggregation + chart suggestion logic
    sessionStore.js # In-memory row cache
  middleware/
    errorHandler.js
    upload.js      # Multer config
  prisma/
    schema.prisma  # Dataset + Chart metadata models
  server.js

frontend/
  src/
    components/
      FileUploader.jsx
      DBConnector.jsx
      DataTable.jsx      # Paginated preview table
      ChartBuilder.jsx   # Axis selectors + type picker
      ChartRenderer.jsx  # Recharts wrapper (bar/line/pie)
      SavedCharts.jsx
      Sidebar.jsx
    pages/
      Dashboard.jsx      # Tab layout: Data / Chart / Saved
    hooks/
      useDataset.js
      useCharts.js
    utils/
      api.js             # Axios instance with session header
      formatters.js
    App.jsx
```

---

## Key Design Decisions

- **Session-based DB connections**: each browser session gets a UUID stored in `localStorage` and sent as `x-session-id`. No credentials are stored server-side beyond the active connection.
- **In-memory row cache**: parsed rows live in a `Map` keyed by `datasetId`. Swap for Redis in production.
- **Aggregation on the server**: the chart service aggregates rows by X-axis value before sending to the client, keeping payloads small even for large datasets.
- **Prisma optional**: the app works without a PostgreSQL connection — chart saving is simply disabled. All other features (file upload, DB connect, chart generation) require no app DB.
