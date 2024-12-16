import styles from './styles.module.css';
import Link from 'next/link';
import BmcaWidget from '../components/bmac/coffee';
import PalletComponent from '../components/viewer/pallet';
import GridView from '../components/onpage/grid/gridView';

export default function Page() {
  const redirects = { about: "", demo: "", editor: "SubApp", document: "", letter: "" };
  return (
    <div className={styles.container}>
      <div className={styles.subcontainer}>
        <PalletComponent url="" mode="viewer"></PalletComponent>
      </div>
      <BmcaWidget></BmcaWidget>
      <div className={styles.gridcontainer}>
        <div className={styles.gridouter}>
          <GridView></GridView>
        </div>
      </div>
    </div>    
  );
}