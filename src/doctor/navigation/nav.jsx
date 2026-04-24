import { Link } from "react-router-dom";
import { useUser } from "../../hooks/useUser";
import { useEffect } from "react";
import styles from "./nav.module.css";
export default function Nav() {
  const { data, isLoading, error, refetch } = useUser();
  useEffect(() => {
    refetch();
  }, []);
  if (isLoading) {
    return;
  }
  return (
    <div className={styles.header}>
      <div className={styles.logoFlex}>
        <span className={styles.icon}>medical_services</span>
        <span className={styles.med}>MEDIORA</span>
      </div>
      <div className={styles.routes}>
        <Link className={styles.link} to="/mainpage/appointements">
          Appointements
        </Link>
        <Link className={styles.link} to="/mainpage/dashboard">
          Dashboard
        </Link>
        <Link className={styles.link} to="/mainpage/profile">
          Profile
        </Link>
      </div>
      <div className={styles.pro}>
        <div>
          <p className={styles.proPara}>{data?.data.first_name}</p>
          <p className={styles.proSpe}>{data?.data.specialty}</p>
        </div>
        <img className={styles.proPic} src={data?.data.picture}></img>
      </div>
    </div>
  );
}
