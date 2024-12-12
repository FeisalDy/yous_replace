# API Documentation

## Base URL

The base URL for the API is: `/api`

---

## Books Endpoints

### 1. Get Books

**URL:** `/api/books`

**Method:** `GET`

**Description:** Retrieve a paginated list of books with optional filtering and sorting.

**Query Parameters:**

| Parameter    | Type       | Required | Default   | Description                                                                            |
| ------------ | ---------- | -------- | --------- | -------------------------------------------------------------------------------------- |
| `page`     | `number` | No       | `1`     | Page number for pagination.                                                            |
| `limit`    | `number` | No       | `10`    | Number of items per page.                                                              |
| `search`   | `string` | No       |           | Search keyword(s) for filtering.                                                       |
| `searchBy` | `string` | No       | `title` | Field to search by (`title`, `author`, `tags`).                                  |
| `sortBy`   | `string` | No       |           | Field to sort by (`bookId`, `score`, `scoreCount`, `countWord`, `updateAt`). |
| `order`    | `string` | No       | `asc`   | Sorting order (`asc` or `desc`).                                                   |

**Response:**

```json
{
  "data": [
    {
      "bookId": 1,
      "en_title": "Sample Title",
      "title": "Judul Contoh",
      "author": "Author Name",
      "tags": ["tag1", "tag2"],
      "score": 4.5,
      "scorerCount": 100,
      "countWord": 50000,
      "cover": "https://example.com/cover.jpg"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

### 2. Get Book Details

**URL:** `/api/book`

**Method:** `GET`

**Description:** Retrieve details of a specific book by `bookId` or `title` with optional comments.

**Query Parameters:**

| Parameter           | Type        | Required | Default   | Description                         |
| ------------------- | ----------- | -------- | --------- | ----------------------------------- |
| `bookId`          | `number`  | No       |           | Book ID.                            |
| `title`           | `string`  | No       |           | Book title.                         |
| `includesComment` | `boolean` | No       | `false` | Include comments in the response.   |
| `page`            | `number`  | No       | `1`     | Page number for comment pagination. |
| `limit`           | `number`  | No       | `10`    | Number of comments per page.        |

**Response:**

```json
{
  "data": {
    "bookId": 1,
    "en_title": "Sample Title",
    "title": "Judul Contoh",
    "author": "Author Name",
    "tags": ["tag1", "tag2"],
    "score": 4.5,
    "scorerCount": 100,
    "countWord": 50000,
    "cover": "https://example.com/cover.jpg",
    "comments": [
      {
        "id": 1,
        "content": "Great book!",
        "score": 5,
        "tags": ["insightful", "engaging"],
        "updateAt": "2024-12-12T12:34:56.000Z",
        "creator": {
          "creatorId": 123,
          "userName": "JohnDoe"
        }
      }
    ]
  },
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

## Comments Endpoints

### 1. Get Comments

**URL:** `/api/comments`

**Method:** `GET`

**Description:** Retrieve a paginated list of comments for a specific book.

**Query Parameters:**

| Parameter          | Type        | Required | Default  | Description                              |
| ------------------ | ----------- | -------- | -------- | ---------------------------------------- |
| `bookId`         | `number`  | Yes      |          | Book ID to filter comments.              |
| `page`           | `number`  | No       | `1`    | Page number for pagination.              |
| `limit`          | `number`  | No       | `20`   | Number of items per page.                |
| `includeBook`    | `boolean` | No       | `true` | Include book details in the response.    |
| `includeCreator` | `boolean` | No       | `true` | Include creator details in the response. |

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "content": "Great book!",
      "score": 5,
      "tags": ["insightful", "engaging"],
      "updateAt": "2024-12-12T12:34:56.000Z",
      "book": {
        "bookId": 1,
        "title": "Judul Contoh",
        "author": "Author Name",
        "tags": ["tag1", "tag2"],
        "score": 4.5,
        "scorerCount": 100,
        "countWord": 50000,
        "cover": "https://example.com/cover.jpg"
      },
      "creator": {
        "creatorId": 123,
        "userName": "JohnDoe"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

### 2. Get Comments by Full-Text Search

**URL:** `/api/comments/search`

**Method:** `GET`

**Description:** Retrieve a paginated list of comments based on a full-text search query.

**Query Parameters:**

| Parameter  | Type       | Required | Default | Description                 |
| ---------- | ---------- | -------- | ------- | --------------------------- |
| `search` | `string` | Yes      |         | Search keyword(s).          |
| `page`   | `number` | No       | `1`   | Page number for pagination. |
| `limit`  | `number` | No       | `20`  | Number of items per page.   |

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "content": "Great book!",
      "score": 5,
      "tags": ["insightful", "engaging"],
      "updateAt": "2024-12-12T12:34:56.000Z",
      "book": {
        "bookId": 1,
        "title": "Judul Contoh",
        "author": "Author Name",
        "tags": ["tag1", "tag2"],
        "score": 4.5,
        "scorerCount": 100,
        "countWord": 50000,
        "cover": "https://example.com/cover.jpg"
      },
      "creator": {
        "creatorId": 123,
        "userName": "JohnDoe"
      }
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

**Error Responses:**
For all endpoints, the following error structure is used:

```json
{
  "error": "Error message",
  "message": "Detailed explanation of the error (if any)."
}
```
