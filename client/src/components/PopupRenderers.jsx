// client/src/components/PopupRenderers.js
import React from 'react';

function Row({ k, v, isLink }) {
  if (v === undefined || v === null || v === '') return null;
  const val = String(v);
  const short = val.length > 120 ? `${val.slice(0, 117)}…` : val;
  return (
    <tr>
      <th style={{ textAlign: 'left', paddingRight: 8 }}>{k}</th>
      <td>{isLink ? <a href={val} target="_blank" rel="noreferrer">{short}</a> : short}</td>
    </tr>
  );
}

export const PopupCounties = ({ p }) => (
  <table className="popup-table">
    <tbody>
      <Row k="County" v={p.County} />
      <Row k="FIPS" v={p.FIPS} />
      <Row k="Rec_Survey" v={p.Rec_Survey} />
      <Row k="NCGS URL" v={p.NCGS_url} isLink />
      <Row k="Checked" v={p.ck_date} />
      <Row k="Area (mi²)" v={p.Area_mi_sq} />
      <Row k="County ID" v={p.County_ID} />
    </tbody>
  </table>
);

export const PopupPrecincts = ({ p }) => (
  <table className="popup-table"><tbody>
    <Row k="ID" v={p.id} />
    <Row k="County ID" v={p.county_id} />
    <Row k="Precinct ID" v={p.prec_id} />
    <Row k="Name" v={p.enr_desc} />
    <Row k="County" v={p.county_nam} />
    <Row k="Old Precinct" v={p.of_prec_id} />
  </tbody></table>
);

export const PopupHouse = ({ p }) => (
  <table className="popup-table"><tbody>
    <Row k="District" v={p.district} />
    <Row k="House ID" v={p.houseid ?? p.id} />
  </tbody></table>
);

export const PopupSenate = ({ p }) => (
  <table className="popup-table"><tbody>
    <Row k="District" v={p.district} />
    <Row k="Senate ID" v={p.senateid ?? p.id} />
  </tbody></table>
);

export const PopupCongress = ({ p }) => (
  <table className="popup-table"><tbody>
    <Row k="District" v={p.district ?? p.id} />
  </tbody></table>
);
