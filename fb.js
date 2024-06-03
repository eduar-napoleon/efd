const Firebird = require('node-firebird');
const util = require('util');
const axios = require('axios');
const FormData = require('form-data');

const options = {
  host: '35.219.75.87',
  port: 3050,
  database: '', // We'll set this dynamically based on the filepath
  user: 'SYSDBA',
  password: 'firebirdefd123',
  lowercase_keys: false, // set to true to lowercase keys
  role: null,            // default
  pageSize: 4096,        // default when creating database
  retryConnectionInterval: 1000 // reconnect interval in case of connection drop
};

async function firebirdConnect(filepath, query) {
  options.database = `/firebird/data/${filepath}`;

  const pool = Firebird.pool(5, options);

  const getTablesQuery = `
    SELECT
        rel.rdb$relation_name AS table_name,
        (
            SELECT FIRST 1 rf.rdb$field_name
            FROM rdb$relation_fields rf
            WHERE rf.rdb$relation_name = rel.rdb$relation_name
                AND (rf.rdb$field_name LIKE '%DATE%' OR rf.rdb$field_name LIKE '%TIME%')
            ORDER BY rf.rdb$field_position ASC
        ) AS date_column
    FROM
        rdb$relations rel
    WHERE
        rel.rdb$view_blr IS NULL
        AND rel.rdb$relation_name NOT LIKE 'TEMP%'
        AND (rel.rdb$system_flag IS NULL OR rel.rdb$system_flag = 0);
  `;

  const getRowCountQuery = (tableName, date_column) => `
    WITH FirstRow AS (
        SELECT FIRST 1 * FROM ${tableName} ${date_column?'ORDER BY '+date_column+' DESC':''}
    ), RowCount AS (
        SELECT COUNT(*) AS COUNT_ROW FROM ${tableName}
    )
    SELECT * FROM RowCount, FirstRow;
  `;

  const connection = util.promisify(pool.get.bind(pool));
  const queryAsync = util.promisify((conn, query, callback) => conn.query(query, callback));
  
  try {
    const db = await connection();

    if (query) {
      const result = await queryAsync(db, query);
      db.detach();
      return {result};
    } else {
      const tablesResult = await queryAsync(db, getTablesQuery);
      const tableCounts = [];

      for (const row of tablesResult) {
        const table_name = row.TABLE_NAME.trim();
        const date_column = row.DATE_COLUMN?.trim();

        query = getRowCountQuery(table_name, date_column);
        const rowCountResult = await queryAsync(db, query);
        if(!rowCountResult[0])  continue;
        const row_counts = rowCountResult[0]?.COUNT_ROW;

        const example_data = rowCountResult[0];
        delete example_data['COUNT_ROW'];
        tableCounts.push({table_name, row_counts, example_data});
      }

      db.detach();
      return {
        options,
        table: tableCounts.sort((b,a) => a.row_counts - b.row_counts).slice(0, 10)
      }
    }
  } catch (error) {
    console.error('Error connecting to Firebird:', error);
    throw error;
  }
}

async function sync(profile_id, path, query ='') {
    const form = new FormData();
    const fileName = path.split('\\').pop();
    const directory = path.substring(0, path.lastIndexOf('\\'));

    form.append('path', directory);
    form.append('filter', fileName);
    form.append('profile_id', profile_id);
    form.append('force', '1');

    const url = `http://dev.otm.zeepos.com:7082/file_sync/${profile_id}`;

    // Alternatively, using axios to make the HTTP request
    const response = await axios.post(url, form, {
        headers: form.getHeaders()
    });

    console.log('File sync response:', response.data);

    // Call firebirdConnect after file sync
    const dt = await firebirdConnect(`${profile_id}/${encodeURIComponent(fileName)}`, query);
    if(dt.result)   return dt.result;
    return {
        fetch: response.data,
        ...dt
    }
}

// Example usage:
// firebirdConnect('slm-ayamgorengsuharti-new/SUHARTIJOGJA.GDB', '')
// sync('slm-ayamgorengsuharti-new', `C:\\Windows\\System32\\SUHARTIJOGJA.GDB`) 
//   .then(result => console.log(result))
//   .catch(error => console.error(error));

module.exports = {
    sync
};
