import React from 'react';
require('./test-schema-panel.css');

function relationToColor(relation) {
  if (relation === 'hasOne') {
    return 'pt-intent-success';
  } else if (relation === 'hasMany') {
    return 'pt-intent-primary';
  }
  return 'pt-intent-danger';
}

function relationToTag(tables, relationList) {
  if (!tables) {
    return <div />;
  }
  return relationList.map(([relation, [tIndex, fIndex]]) => (
    <span
      key={tIndex.toString()}
      className={`pt-tag pt-round field-tag ${relationToColor(relation)}`}
    >
      {relation}
      {': '}
      {tables[tIndex][0]}
    </span>
  ));
}

function tableRelations(tables) {
  if (!tables) {
    return <div />;
  }
  const relations = tables.map(() => []);
  tables.forEach(([key, value], tIndex) => {
    value.forEach((field, fIndex) => {
      if (!field.index && field.fk && field.foreignTarget) {
        relations[tIndex].push(['belongsTo', field.foreignTarget]);
        const hasRelation = field.manyToOne ? 'hasMany' : 'hasOne';
        relations[field.foreignTarget[0]].push([hasRelation, [tIndex, fIndex]]);
      }
    });
  });
  return relations;
}

function tablesToCards(tables, activeTableIndex, activeFieldIndex, setTableAndField) {
  if (!tables) {
    return <div />;
  }
  const relations = tableRelations(tables);
  // console.log(relations);
  return tables.map(([key, value], tIndex) => (
    <div
      key={key}
      className={`pt-card ${tIndex === activeTableIndex ? 'pt-elevation-4' : 'pt-elevation-1'}`}
      style={{ margin: '10px' }}
    >
      <h4>
        <b>
          {key}
          {relationToTag(tables, relations[tIndex])}
        </b>
      </h4>
      <hr />
      <div>
        {value.map((field, fIndex) => (
          <div
            key={field.name}
            className={`schema-field-button ${
              tIndex === activeTableIndex && fIndex === activeFieldIndex
                ? 'schema-field-button-active'
                : ''
            }`}
            onClick={() => setTableAndField(tIndex, fIndex)}
          >
            <div className="field-name">{field.name}</div>
            <div className="field-dataType">{field.dataType}</div>
            {field.index ? (
              <span className="pt-tag pt-round pt-minimal field-tag">Index</span>
            ) : (
              <span />
            )}
            {field.pk ? (
              <span className="pt-tag pt-round pt-minimal field-tag pt-intent-primary">
                Primary
              </span>
            ) : (
              <span />
            )}
            {!field.index && !field.pk && field.nullable ? (
              <span className="pt-tag pt-round pt-minimal field-tag pt-intent-success">
                Nullable
              </span>
            ) : (
              <span />
            )}
            {!field.index && field.fk && field.foreignTarget ? (
              <span className="pt-tag pt-round pt-minimal field-tag pt-intent-warning">
                Foreign
              </span>
            ) : (
              <span />
            )}

            {!field.index && !field.pk && !field.fk && field.unique ? (
              <span className="pt-tag pt-round pt-minimal field-tag pt-intent-danger">Unique</span>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>
    </div>
  ));
}

export { tablesToCards, tableRelations };
