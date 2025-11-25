# KV vs DB 비교

## KV (Key-Value Store)

```
저장: key → value
예시: "user:123" → {"name": "김철수", "age": 30}
```

### 특징
- **단순 구조** - 키로 값을 찾는 것만 가능
- **빠른 읽기** - 글로벌 캐시처럼 작동
- **제한된 쿼리** - 키를 알아야만 조회 가능
- **eventual consistency** - 쓰기 후 읽기에 약간 지연

### 할 수 있는 것
```javascript
kv.get("user:123")         // ✅ 키로 조회
kv.put("user:123", data)   // ✅ 저장
kv.list({prefix: "user:"}) // ✅ prefix로 목록
```

### 할 수 없는 것
```sql
-- ❌ 불가능
SELECT * FROM users WHERE age > 25
SELECT * FROM users ORDER BY created_at
JOIN, GROUP BY, SUM, COUNT...
```

---

## DB (관계형 데이터베이스)

```
저장: 테이블 (행/열 구조)
예시: users 테이블 → id, name, age, email...
```

### 특징
- **복잡한 구조** - 테이블, 관계, 인덱스
- **강력한 쿼리** - SQL로 뭐든 가능
- **ACID** - 트랜잭션, 일관성 보장
- **느림** - KV보다 오버헤드 있음

### 할 수 있는 것
```sql
SELECT * FROM users WHERE age > 25
SELECT * FROM comments ORDER BY created_at DESC
SELECT u.name, COUNT(c.id) FROM users u JOIN comments c...
```

---

## 비교 요약

| 항목 | KV | DB |
|------|----|----|
| 구조 | key → value | 테이블 (행/열) |
| 쿼리 | 키 조회만 | SQL (뭐든 가능) |
| 속도 | 빠름 | 상대적으로 느림 |
| 복잡도 | 단순 | 복잡 |
| 관계 | 없음 | JOIN 가능 |
| 일관성 | eventual | strong (ACID) |

---

## 언제 뭘 쓰나?

| 상황 | 선택 |
|------|------|
| 세션, 캐시, 설정 | KV |
| 단순 CRUD, 소규모 | KV |
| 복잡한 쿼리, 검색 | DB |
| 대규모 데이터 | DB |
| 관계 있는 데이터 | DB |

---

## Cloudflare 옵션

- **KV** - 단순, 빠름 (현재 프로젝트에서 사용 중)
- **D1** - SQLite 기반 DB (복잡한 쿼리 가능)
- **Durable Objects** - 실시간, 상태 유지

---

## 현재 프로젝트 상황

이 프로젝트는 **Cloudflare KV**를 사용 중.

### 문제점
- 댓글 목록 조회 시 모든 댓글을 하나씩 읽어야 함
- 필터링/정렬을 코드에서 직접 해야 함
- 댓글이 많아지면 느려질 수 있음

### 현재 코드 (kv.ts)
```typescript
// 비효율적 - 모든 댓글을 순회
for (const id of index) {
  const comment = await getComment(kv, id)  // 매번 KV 호출
  if (comment) {
    if (status === 'all' || comment.status === status) {
      allComments.push(comment)
    }
  }
}
```

### 개선 방안
댓글이 많아지면 **D1으로 마이그레이션** 고려할 만함.
