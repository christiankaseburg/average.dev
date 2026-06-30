import styles from './app.module.scss';

export function App() {
  const currentYear = new Date().getFullYear();
  
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Website In Progress</h1>
      </div>

      <div className={styles.footer}>
        &copy; {currentYear} Average Dev LLC. All rights reserved.
      </div>
    </div>
  );
}

export default App;
