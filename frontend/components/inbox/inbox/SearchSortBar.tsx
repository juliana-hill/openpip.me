import styles from "./SearchSortBar.module.css";

type Sort = "date" | "sender" | "count";

type Props = {
  search: string;
  sort: Sort;
  grouped: boolean;
  onSearch: (v: string) => void;
  onSort: (v: Sort) => void;
  onGroupToggle: () => void;
  onRefresh: () => void;
};

export function SearchSortBar({ search, sort, grouped, onSearch, onSort, onGroupToggle, onRefresh }: Props) {
  return (
    <div className={styles.bar}>
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>🔍</span>
        <input
          className={styles.input}
          placeholder="Search emails..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clear} onClick={() => onSearch("")} aria-label="Clear">✕</button>
        )}
      </div>
      <div className={styles.controls}>
        <select
          className={styles.sortSelect}
          value={sort}
          onChange={(e) => onSort(e.target.value as Sort)}
        >
          <option value="date">Date</option>
          <option value="sender">Sender</option>
          <option value="count">Count</option>
        </select>
        <button
          className={`${styles.iconBtn} ${grouped ? styles.active : ""}`}
          onClick={onGroupToggle}
          title={grouped ? "Ungroup" : "Group by sender"}
        >
          ⊞
        </button>
        <button className={styles.iconBtn} onClick={onRefresh} title="Refresh">↻</button>
      </div>
    </div>
  );
}
