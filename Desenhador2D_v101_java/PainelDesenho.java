import java.awt.Color;
import java.awt.Graphics;
import java.awt.event.MouseEvent;
import java.awt.event.MouseListener;
import java.awt.event.MouseMotionListener;

import javax.swing.JLabel;
import javax.swing.JPanel;

import ponto.FiguraPontos;
import reta.FiguraRetas;

/**
 * Cria desenhos de acordo com o tipo e eventos do mouse
 * 
 * @author Julio Arakaki 
 * @version 20220815
 */
public class PainelDesenho extends JPanel implements MouseListener, MouseMotionListener {

    JLabel msg;           // Label para mensagens
    TipoPrimitivo tipo; // Tipo do primitivo
    Color corAtual;       // Cor atual do primitivo
    int esp;              // Diametro do ponto

    // Para ponto
    int x, y;

    // Para reta
    int x1, y1, x2, y2;

    // selecionar primeiro click do mouse
    boolean primeiraVez = true;


    /**
     * Constroi o painel de desenho
     *
     * @param msg mensagem a ser escrita no rodape do painel
     * @param tipo tipo atual do primitivo
     * @param corAtual cor atual do primitivo
     * @param esp espessura atual do primitivo
     */
    public PainelDesenho(JLabel msg, TipoPrimitivo tipo, Color corAtual, int esp){
        setTipo(tipo);
        setMsg(msg);
        setCorAtual(corAtual);
        setEsp(esp);

        // Adiciona "ouvidor" de eventos de mouse
        this.addMouseListener(this); 
        this.addMouseMotionListener(this);

    }

    /**
     * Altera o tipo atual do primitivo
     *
     * @param tipo tipo do primitivo
     */
    public void setTipo(TipoPrimitivo tipo){
        this.tipo = tipo;
    }

    /**
     * Retorna o tipo do primitivo
     *
     * @return tipo do primitivo
     */
    public TipoPrimitivo getTipo(){
        return this.tipo;
    }

    /**
     * Altera a espessura do primitivo
     *
     * @param esp espessura do primitivo
     */
    public void setEsp(int esp){
        this.esp = esp;
    }

    /**
     * Retorna a espessura do primitivo
     *
     * @return espessura do primitivo
     */
    public int getEsp(){
        return this.esp;
    }

    /**
     * Altera a cor atual do primitivo
     *
     * @param corAtual cor atual do primitivo
     */
    public void setCorAtual(Color corAtual){
        this.corAtual = corAtual;
    }

    /**
     * retorna a cor atual do primitivo
     *
     * @return cor atual do primitivo
     */
    public Color getCorAtual(){
        return this.corAtual;
    }

    /**
     * Altera a msg a ser apresentada no rodape
     *
     * @param msg mensagem a ser apresentada
     */
    public void setMsg(JLabel msg){
        this.msg = msg;
    }

    /**
     * Retorna a mensagem
     *
     * @return mensagem as ser apresentada no rodape
     */
    public JLabel getMsg(){
        return this.msg;
    }

    /**
     * Metodo chamado quando o paint eh acionado
     *
     * @param g biblioteca para desenhar em modo grafico
     */
    public void paintComponent(Graphics g) {   
        desenharPrimitivos(g);
    }

    
    /**
     * Evento: pressionar do mouse
     *
     * @param e dados do evento
     */
    public void mousePressed(MouseEvent e) { 
        Graphics g = getGraphics();  
        if (tipo == TipoPrimitivo.PONTO){
            x = e.getX();
            y = e.getY();
            paint(g);
        } else if (tipo == TipoPrimitivo.RETA){

            if (primeiraVez == true) {
                x1 = (int)e.getX();
                y1 = (int)e.getY();
                primeiraVez = false;
            } else {
                x2 = (int)e.getX();
                y2 = (int)e.getY();
                primeiraVez = true;
                paint(g);
            }
        }
    }     

    public void mouseReleased(MouseEvent e) { 
    }           

    public void mouseClicked(MouseEvent e) {
    }

    public void mouseEntered(MouseEvent e) {
    }

    public void mouseExited(MouseEvent e) {
    }

    public void mouseDragged(MouseEvent e) {
    }

    /**
     * Evento mouseMoved: escreve mensagem no rodape (x, y) do mouse
     *
     * @param e dados do evento do mouse
     */
    public void mouseMoved(MouseEvent e) {
        this.msg.setText("("+e.getX() + ", " + e.getY() + ") - " + getTipo());
    }

    /**
     * Desenha os primitivos
     *
     * @param g biblioteca para desenhar em modo grafico
     */
    public void desenharPrimitivos(Graphics g){
        if (tipo == TipoPrimitivo.PONTO){
            FiguraPontos.desenharPonto(g, x, y, "", getEsp(), getCorAtual());
            //FiguraPontos.desenharPontos(g, 50, 20);
        }

        if (tipo == TipoPrimitivo.RETA){
            FiguraRetas.desenharReta(g, x1, y1, x2, y2, "", getEsp(), getCorAtual());
            //FiguraRetas.desenharRetas(g, 10, 3);
        }

        if (tipo==TipoPrimitivo.CIRCULO){
            //FiguraCirculos.desenharCirculo(g, x1, y1, x2, y2, "", getEsp(), getCorAtual());
        }
    }
}
