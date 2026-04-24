import { useEffect, useState } from "react";
import styles from './doctor-signup-first.module.css'
import LocationPicker from "./map";
import { useAuth } from "../../contexts/authContext";
import { useNavigate } from "react-router";
import { TailSpin } from "react-loader-spinner";
export default function DoctorSignFirst({setStep}){
    const {completeSignup,checkUser}=useAuth();
  const [fullName,setFullName]=useState("");
  const [userName,setUserName]=useState("");
  const [speciality,setSpeciality]=useState("general practice");
  const [gender,setGender]=useState("male");
  const email=sessionStorage.getItem("email");
  const pass=sessionStorage.getItem("password");
  return (
  <div className={styles.dark}>
    <div className={styles.main}>
        <aside className={styles.aside}>
             <img className={styles.Im1} src="https://lh3.googleusercontent.com/aida-public/AB6AXuARuzrU5BInM8N7Ul7R2cn4pF-I_vQJIQv7ks61JVmCOU7u_2a7Dyua0iR4WqaIEqCGP7WPV0xPkNQNtYu5-EqpHauCTQdUVr1d0KUW4tazOM6RJRRAY0bt_HW8K9EwauLV-RN-eRwyx_0h15lZeJ39jLVLN-tJmBdLElRZEuoIhJYHiYVMKz-y2hmq-08XpU_BQdWDvMix6TEDSfnOdcat1kiaI8PhlYTRcKgNSt_Sno4lLT6aXJDyJvEpJ1-T5pcOYJFTHDFG7ruD" />
             <h2 className={styles.asideHead}>Join Our Community</h2>
             <p className={styles.asidePara}>Connect with patients and manage your medical profile seamlessly</p>
        </aside>
        <section className={styles.section}>
            <header className={styles.header}>
                <h1 className={styles.headerHead}>Professional Registration</h1>
                <p className={styles.headerPara}>Complete your practitioner profile to begin clinical sessions.</p>
            </header>
            <form onSubmit={(e)=>{
                e.preventDefault();
            }}>
                <div className={styles.form}>
                <div className={styles.infoDiv}>
                    <label className={styles.infoDivLabel}>Full Name</label>
                    <input onChange={(e)=>setFullName(e.target.value)} className={styles.infoDivText} type="text" placeholder="John Doe"/>
                </div>
                <div className={styles.infoDiv}>
                    <label className={styles.infoDivLabel}>Speciality</label>
                    <select onChange={(e)=>setSpeciality(e.target.value)} className={styles.infoDivSelect}>
                        <option value="general practice">General Practice</option>
                        <option value="family medicine">Family Medicine</option>
                        <option value="internal medicine">Internal Medicine</option>
                        <option value="pediatrics">Pediatrics</option>
                        <option value="emergency medicine">Emergency Medicine</option>
                        <option value="cardiology">Cardiology</option>
                        <option value="dermatology">DermaTology</option>
                        <option value="neurology">Neurology</option>
                        <option value="psychiatry">Psychiatry</option>
                        <option value="general surgery">General Surgery</option>
                        <option value="orthopedic surgery">Orthopedic Surgery</option>
                        <option value="obstetrics genecology">Obstetrics & Genecology</option>
                        <option value="opthalmology">Opthalmology</option>
                        <option value="ent">Otolaryngology (ent)</option>
                        <option value="radiology">Radiology</option>
                    </select>
                </div>
                <div className={styles.infoDiv}>
                    <label className={styles.infoDivLabel}>User Name</label>
                    <input onChange={(e)=>{
                        setUserName(e.target.value)
                    checkUser.reset()}} className={styles.infoDivText} type="text" placeholder="Dr. username"
                    ></input>
                    {checkUser.data?.exists && <span className={styles.exist}>Username already Taken</span>}
                </div>
                <div className={styles.spanner}>
                    <div className={styles.radio}>
                        <label className={styles.formLabel}>Select Gender</label>
                        <div className={styles.radioGrid}>
                        <div>
                         <input defaultChecked onChange={(e)=>setGender(e.target.value)} id="role_patient" type="radio" name="role" value="male" className={styles.roleSelect}></input>
                         <label htmlFor="role_patient" className={styles.selectFlex}>
                          <span className={styles.selectIcon}>male</span>
                           Male
                         </label>
                        </div>
                        <div>
                            <input onChange={(e)=>setGender(e.target.value)} id="role_doctor" type="radio" name="role" value="female" className={styles.roleSelect}></input>
                            <label htmlFor="role_doctor"className={styles.selectFlex} >
                                <span className={styles.selectIcon}>female</span>
                                Female
                            </label>
                        </div>
                    </div>
                </div>
                </div>
                </div>
                <div className={styles.verify}>
                    {(completeSignup.isError||checkUser.isError) && <span className={styles.exist}>Make sure to fill all fields and try again</span>}
                    <button type="button" disabled={checkUser.isPending||completeSignup.isPending||!fullName||!userName} onClick={
                        ()=>{
                            checkUser.mutate({username:userName},{
                                onSuccess:(data)=>{
                                    if (!data.exists){
                                    if (!email || !pass){
                                        setStep(1);
                                    }
                                    completeSignup.mutate({
                                    first_name:fullName,
                                    username:userName,
                                    email:email,
                                    password:pass,
                                    role:"doctor",
                                    gender:gender,
                                    specialty:speciality
                                })}
                                },
                                onError:(err)=>{
                                    console.log("FULL ERROR:", err);
                                    console.log("MESSAGE:", err.message);
                                    console.log("RESPONSE:", err.response);
                                }
                            })
                           
                        }
                    } className={checkUser.isPending||completeSignup.isPending||!fullName||!userName?styles.wait:styles.continue}>
                       {checkUser.isPending||completeSignup.isPending?<TailSpin height="20" width="20" color="#215eed"></TailSpin> :(fullName&&userName?"Confirm Information":"Please Enter your Informations")}
                    </button>
                </div>
            </form>
        </section>
    </div>
  </div>
  )
}