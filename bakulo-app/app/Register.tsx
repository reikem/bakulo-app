/**
 * app/Register.tsx  ← nombre con R mayúscula = ruta /Register
 * ✅ Rutas corregidas: router.push('/login')
 * ✅ Sin expo-auth-session / expo-crypto
 */
import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TextInput, TouchableOpacity,
  SafeAreaView, Dimensions, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, User, AtSign, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { authRegister, authWithGoogle, authWithApple } from '@/service/authService';

const { width } = Dimensions.get('window');
const C = {
  bg:'#171d1e', primary:'#004e63', primaryFixed:'#baeaff',
  secondaryDim:'#a9cec4', surface:'rgba(43,49,50,0.3)',
  primaryContainer:'#006782', onPrimaryContainer:'#9fe2ff',
};

// ─── CAMPO REUTILIZABLE ───────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, icon, secure, keyboardType, error, editable=true }: {
  label:string; value:string; onChange:(v:string)=>void; placeholder:string;
  icon:React.ReactNode; secure?:boolean; keyboardType?:any; error?:string; editable?:boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={f.group}>
      <Text style={f.label}>{label}</Text>
      <View style={[f.wrap, !!error && f.wrapErr]}>
        {icon}
        <TextInput style={f.input} value={value} onChangeText={onChange}
          placeholder={placeholder} placeholderTextColor="rgba(169,206,196,0.28)"
          secureTextEntry={secure && !show} keyboardType={keyboardType ?? 'default'}
          autoCapitalize="none" editable={editable}/>
        {secure && (
          <TouchableOpacity onPress={()=>setShow(v=>!v)}>
            {show ? <Eye color={C.secondaryDim} size={18}/> : <EyeOff color={C.secondaryDim} size={18}/>}
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={f.err}>{error}</Text>}
    </View>
  );
}
const f = StyleSheet.create({
  group:{gap:5},
  label:{fontSize:9,fontWeight:'800',color:C.secondaryDim,letterSpacing:1.5,paddingHorizontal:4},
  wrap: {flexDirection:'row',alignItems:'center',backgroundColor:C.surface,borderRadius:14,paddingHorizontal:14,height:52,borderWidth:1,borderColor:'transparent',gap:10},
  wrapErr:{borderColor:'rgba(239,68,68,0.45)'},
  input:{flex:1,color:'#fff',fontSize:15},
  err:  {color:'#ef4444',fontSize:11,marginLeft:4},
});

// ─── INDICADOR FUERZA ─────────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  const checks = [
    {label:'Mínimo 8 caracteres', ok:password.length >= 8},
    {label:'Una mayúscula',        ok:/[A-Z]/.test(password)},
    {label:'Un número',            ok:/[0-9]/.test(password)},
    {label:'Un carácter especial', ok:/[^A-Za-z0-9]/.test(password)},
  ];
  const score = checks.filter(c=>c.ok).length;
  const color = score<=1?'#ef4444':score===2?'#f59e0b':score===3?'#86d0ef':'#22c55e';
  const lbl   = ['Muy débil','Débil','Regular','Fuerte'][score-1] ?? 'Muy débil';
  return (
    <View style={ps.container}>
      <View style={ps.bars}>
        {[1,2,3,4].map(i=><View key={i} style={[ps.bar, i<=score&&{backgroundColor:color}]}/>)}
      </View>
      <Text style={[ps.label,{color}]}>{lbl}</Text>
      <View style={ps.checks}>
        {checks.map(c=>(
          <View key={c.label} style={ps.row}>
            <Text style={[ps.dot,{color:c.ok?'#22c55e':'#3f484c'}]}>●</Text>
            <Text style={[ps.text,{color:c.ok?'#bfc8cd':'#3f484c'}]}>{c.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const ps = StyleSheet.create({
  container:{backgroundColor:'rgba(255,255,255,0.03)',borderRadius:12,padding:12,gap:8},
  bars:{flexDirection:'row',gap:4},
  bar: {flex:1,height:4,borderRadius:2,backgroundColor:'#252d2f'},
  label:{fontSize:11,fontWeight:'800',textAlign:'right',marginTop:-6},
  checks:{flexDirection:'row',flexWrap:'wrap',gap:6},
  row:  {flexDirection:'row',alignItems:'center',gap:4},
  dot:  {fontSize:6},
  text: {fontSize:10},
});

// ─── PANTALLA POST-REGISTRO ───────────────────────────────────────────────────
function VerifyScreen({ email, onBack }: { email:string; onBack:()=>void }) {
  const router = useRouter();
  return (
    <SafeAreaView style={ve.container}>
      <ScrollView contentContainerStyle={ve.scroll}>
        <View style={ve.iconWrap}><Text style={ve.emoji}>📧</Text></View>
        <Text style={ve.title}>¡Revisa tu correo!</Text>
        <Text style={ve.body}>Enviamos un enlace de activación a:</Text>
        <Text style={ve.emailText}>{email}</Text>
        <Text style={ve.body2}>
          Haz click en el enlace para activar tu cuenta.
        </Text>
        <View style={ve.stepsCard}>
          {[
            '1. Abre tu correo electrónico',
            '2. Busca el mensaje de Serenity',
            '3. Haz click en "Confirmar correo"',
            '4. Vuelve aquí e inicia sesión',
          ].map((step,i)=>(
            <View key={i} style={ve.step}>
              <CheckCircle2 color="#22c55e" size={14}/>
              <Text style={ve.stepText}>{step}</Text>
            </View>
          ))}
        </View>
        <Text style={ve.spam}>¿No lo ves? Revisa la carpeta de spam.</Text>
        <TouchableOpacity style={ve.loginBtn} onPress={()=>router.replace('/login')}>
          <Text style={ve.loginBtnText}>Ya verifiqué — Iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ve.backBtn} onPress={onBack}>
          <Text style={ve.backBtnText}>Volver al registro</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
const ve = StyleSheet.create({
  container:{flex:1,backgroundColor:C.bg},
  scroll:   {paddingHorizontal:28,paddingTop:60,paddingBottom:40,alignItems:'center'},
  iconWrap: {width:100,height:100,borderRadius:50,backgroundColor:'rgba(0,103,130,0.15)',justifyContent:'center',alignItems:'center',marginBottom:24},
  emoji:    {fontSize:44},
  title:    {color:'#baeaff',fontSize:28,fontWeight:'900',textAlign:'center',marginBottom:12},
  body:     {color:'#6f787d',fontSize:14,textAlign:'center',lineHeight:21},
  emailText:{color:'#86d0ef',fontSize:16,fontWeight:'800',textAlign:'center',marginVertical:8,backgroundColor:'rgba(134,208,239,0.1)',paddingHorizontal:16,paddingVertical:8,borderRadius:12,width:'100%'},
  body2:    {color:'#6f787d',fontSize:13,textAlign:'center',lineHeight:20,marginTop:8,marginBottom:24},
  stepsCard:{backgroundColor:'#1a1a1a',borderRadius:18,padding:18,gap:12,width:'100%',marginBottom:20},
  step:     {flexDirection:'row',alignItems:'center',gap:10},
  stepText: {color:'#bfc8cd',fontSize:13},
  spam:     {color:'#3f484c',fontSize:12,textAlign:'center',fontStyle:'italic',marginBottom:28},
  loginBtn: {backgroundColor:C.primaryContainer,height:52,borderRadius:26,justifyContent:'center',alignItems:'center',width:'100%',marginBottom:12},
  loginBtnText:{color:'#fff',fontSize:15,fontWeight:'800'},
  backBtn:  {paddingVertical:12},
  backBtnText:{color:'#6f787d',fontSize:14},
});

// ─── PANTALLA PRINCIPAL ───────────────────────────────────────────────────────
export default function RegisterScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username,    setUsername]    = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [oauthLoad,   setOauthLoad]   = useState<'google'|'apple'|null>(null);
  const [errors,      setErrors]      = useState<Record<string,string>>({});
  const [registered,  setRegistered]  = useState(false);

  const validate = (): boolean => {
    const errs: Record<string,string> = {};
    if (!displayName.trim() || displayName.trim().length < 2) errs.displayName = 'Mínimo 2 caracteres.';
    if (!username.trim() || username.trim().length < 3)       errs.username    = 'Mínimo 3 caracteres, sin espacios.';
    else if (!/^[a-z0-9_]+$/.test(username.trim()))          errs.username    = 'Solo letras, números y _';
    if (!email.trim() || !email.includes('@'))                errs.email       = 'Ingresa un correo válido.';
    if (password.length < 8)                                  errs.password    = 'Mínimo 8 caracteres.';
    else if (!/[A-Z]/.test(password))                         errs.password    = 'Al menos una mayúscula.';
    else if (!/[0-9]/.test(password))                         errs.password    = 'Al menos un número.';
    if (confirmPass !== password)                             errs.confirmPass = 'Las contraseñas no coinciden.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const result = await authRegister({
        displayName: displayName.trim(),
        username:    username.trim().toLowerCase(),
        email:       email.trim().toLowerCase(),
        password,
      });
      if (!result.success) {
        if (result.error?.includes('correo') || result.error?.includes('email'))
          setErrors({ email: result.error! });
        else Alert.alert('Error', result.error ?? 'No se pudo crear la cuenta.');
        return;
      }
      setRegistered(true);
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setOauthLoad('google');
    try {
      const r = await authWithGoogle();
      if (r.error === '_OAUTH_REDIRECT_') return; // esperando deep link
      if (!r.success) Alert.alert('Google', r.error ?? 'Error.');
      else router.replace('/(tabs)');
    } finally { setOauthLoad(null); }
  };

  const handleApple = async () => {
    setOauthLoad('apple');
    try {
      const r = await authWithApple();
      if (!r.success) { Alert.alert('Apple', r.error ?? 'Error.'); return; }
      router.replace('/(tabs)');
    } finally { setOauthLoad(null); }
  };

  if (registered) return <VerifyScreen email={email} onBack={()=>setRegistered(false)}/>;

  return (
    <SafeAreaView style={s.container}>
      <View style={[s.blur,{top:-50,left:-50,backgroundColor:C.primary}]}/>
      <View style={[s.blur,{bottom:-50,right:-50,backgroundColor:'#005229'}]}/>

      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          <View style={s.header}>
            <TouchableOpacity onPress={()=>router.back()} style={s.backBtn}>
              <ArrowLeft color={C.secondaryDim} size={22}/>
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.title}>Crear cuenta</Text>
              <Text style={s.subtitle}>Empieza a gestionar tu salud hoy.</Text>
            </View>
          </View>

          {/* OAuth */}
          <View style={s.oauthCol}>
            <TouchableOpacity style={s.oauthBtn} onPress={handleGoogle}
              disabled={!!oauthLoad||loading} activeOpacity={0.85}>
              {oauthLoad==='google'
                ? <ActivityIndicator color="#fff" size="small"/>
                : <><Image source={{uri:'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.png'}}
                      style={s.oauthIcon}/><Text style={s.oauthText}>Continuar con Google</Text></>}
            </TouchableOpacity>
            {Platform.OS==='ios' && (
              <TouchableOpacity style={[s.oauthBtn,{backgroundColor:'rgba(255,255,255,0.05)'}]}
                onPress={handleApple} disabled={!!oauthLoad||loading} activeOpacity={0.85}>
                {oauthLoad==='apple'
                  ? <ActivityIndicator color="#fff" size="small"/>
                  : <><Text style={s.appleGlyph}></Text><Text style={s.oauthText}>Continuar con Apple</Text></>}
              </TouchableOpacity>
            )}
          </View>

          <View style={s.divider}>
            <View style={s.divLine}/><Text style={s.divText}>O REGÍSTRATE CON EMAIL</Text><View style={s.divLine}/>
          </View>

          <View style={s.form}>
            <Field label="NOMBRE COMPLETO" value={displayName}
              onChange={v=>{setDisplayName(v);setErrors(e=>({...e,displayName:''}));}}
              placeholder="Ej: Juan García" icon={<User color={C.secondaryDim} size={18}/>}
              error={errors.displayName} editable={!loading}/>

            <Field label="NOMBRE DE USUARIO" value={username}
              onChange={v=>{setUsername(v.toLowerCase().replace(/\s/g,''));setErrors(e=>({...e,username:''}));}}
              placeholder="ej: juan_garcia" icon={<AtSign color={C.secondaryDim} size={18}/>}
              error={errors.username} editable={!loading}/>

            <Field label="CORREO ELECTRÓNICO" value={email}
              onChange={v=>{setEmail(v);setErrors(e=>({...e,email:''}));}}
              placeholder="nombre@correo.com" icon={<Mail color={C.secondaryDim} size={18}/>}
              keyboardType="email-address" error={errors.email} editable={!loading}/>

            <Field label="CONTRASEÑA" value={password}
              onChange={v=>{setPassword(v);setErrors(e=>({...e,password:''}));}}
              placeholder="Mín. 8 car., 1 mayúscula, 1 número"
              icon={<Lock color={C.secondaryDim} size={18}/>}
              secure error={errors.password} editable={!loading}/>

            {password.length > 0 && <PasswordStrength password={password}/>}

            <Field label="CONFIRMAR CONTRASEÑA" value={confirmPass}
              onChange={v=>{setConfirmPass(v);setErrors(e=>({...e,confirmPass:''}));}}
              placeholder="Repite tu contraseña"
              icon={<Lock color={C.secondaryDim} size={18}/>}
              secure error={errors.confirmPass} editable={!loading}/>

            <Text style={s.terms}>
              Al registrarte aceptas nuestros{' '}
              <Text style={s.termsLink}>Términos de Servicio</Text>
              {' '}y{' '}
              <Text style={s.termsLink}>Política de Privacidad</Text>.
            </Text>

            <TouchableOpacity style={[s.registerBtn,(loading||!!oauthLoad)&&s.btnOff]}
              onPress={handleRegister} disabled={loading||!!oauthLoad} activeOpacity={0.85}>
              {loading
                ? <ActivityIndicator color="#003746"/>
                : <Text style={s.registerBtnText}>Crear cuenta gratis</Text>}
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={()=>router.push('/login')}>
              <Text style={s.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container:   {flex:1,backgroundColor:C.bg},
  blur:        {position:'absolute',width:width*0.8,height:width*0.8,borderRadius:(width*0.8)/2,opacity:0.12},
  scroll:      {paddingHorizontal:24,paddingTop:Platform.OS==='ios'?20:30,paddingBottom:50},
  header:      {flexDirection:'row',alignItems:'center',gap:12,marginBottom:24},
  backBtn:     {padding:8,backgroundColor:'rgba(255,255,255,0.05)',borderRadius:12},
  headerCenter:{flex:1},
  title:       {color:'#baeaff',fontSize:26,fontWeight:'900'},
  subtitle:    {color:'#6f787d',fontSize:13,marginTop:2},
  oauthCol:    {gap:10,marginBottom:20},
  oauthBtn:    {flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:C.surface,height:50,borderRadius:14,borderWidth:1,borderColor:'rgba(255,255,255,0.06)',gap:10},
  oauthIcon:   {width:20,height:20},
  appleGlyph:  {fontSize:20,color:'#fff'},
  oauthText:   {color:'#fff',fontSize:14,fontWeight:'600'},
  divider:     {flexDirection:'row',alignItems:'center',gap:10,marginBottom:20},
  divLine:     {flex:1,height:1,backgroundColor:'rgba(255,255,255,0.08)'},
  divText:     {color:'#3f484c',fontSize:9,letterSpacing:1,fontWeight:'700'},
  form:        {gap:14},
  terms:       {color:'#3f484c',fontSize:11,lineHeight:17,textAlign:'center',paddingHorizontal:4},
  termsLink:   {color:'#86d0ef',fontWeight:'700'},
  registerBtn: {backgroundColor:'#c4ebe0',height:54,borderRadius:27,justifyContent:'center',alignItems:'center',marginTop:4},
  btnOff:      {opacity:0.5},
  registerBtnText:{color:'#003746',fontSize:16,fontWeight:'900'},
  footer:      {flexDirection:'row',justifyContent:'center',alignItems:'center',marginTop:24},
  footerText:  {color:'#6f787d',fontSize:14},
  loginLink:   {color:C.primaryFixed,fontWeight:'800',fontSize:14},
});