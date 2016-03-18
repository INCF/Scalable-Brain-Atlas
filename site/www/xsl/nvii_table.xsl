<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:template match="/">
  <html>
  <head>
  </head>
  <body>
  <div>
  <h2>List of supported regions</h2>
    <table border="1">
      <tr bgcolor="#9acd32">
        <th>Abbreviation</th>
        <th>Full name</th>
        <th>Part of</th>
      </tr>
      <xsl:for-each select="//object[@class='projekt.Hirnobjekt']">
      <tr>
        <td><xsl:value-of select="void[@property='nameObjectForView']/void[@property='shortName']/string"/></td>
        <td><xsl:value-of select="void[@property='nameObjectForView']/void[@property='name']/string"/></td>
        <td><xsl:value-of select="void[@property='vater']/object/@idref"/></td>
      </tr>
      </xsl:for-each>
    </table>
  </div>
  </body>
  </html>
</xsl:template>
</xsl:stylesheet>
